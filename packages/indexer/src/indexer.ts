import { createPublicClient, http, type Address, type Chain } from 'viem';
import { foundry, baseSepolia } from 'viem/chains';
import { PrismaClient } from './generated/prisma';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import {
  EscrowKind,
  FactoryV1ABI,
  FactoryV2ABI,
  MilestoneEscrowV1ABI,
  MilestoneEscrowV2ABI,
  ProtocolVersion,
  VerificationOracleABI,
  resolveDeployments,
} from '@escrowkit/protocol';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CHAIN_ID = process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : 84532;
const chains: Record<number, Chain> = {
  31337: foundry,
  84532: baseSepolia,
};
const selectedChain = chains[CHAIN_ID] ?? baseSepolia;

const client = createPublicClient({
  chain: selectedChain,
  transport: http(process.env.RPC_URL || 'http://127.0.0.1:8545'),
});

const deploymentOverrides = {
  ...(process.env.FACTORY_ADDRESS ? { primaryFactoryAddress: process.env.FACTORY_ADDRESS as `0x${string}` } : {}),
  ...(process.env.LEGACY_FACTORY_ADDRESSES ? { legacyFactoryAddressesCsv: process.env.LEGACY_FACTORY_ADDRESSES } : {}),
  ...(process.env.VERIFICATION_ORACLE_ADDRESS ? { verificationOracleAddress: process.env.VERIFICATION_ORACLE_ADDRESS as `0x${string}` } : {}),
};

const deployments = resolveDeployments(CHAIN_ID, deploymentOverrides);

const PRIMARY_FACTORY_ADDRESS = deployments.primaryFactoryAddress;
const LEGACY_FACTORY_ADDRESSES = deployments.legacyFactoryAddresses;
const VERIFICATION_ORACLE_ADDRESS = deployments.verificationOracleAddress ?? null;

const watchedEscrows = new Set<string>();

function serializeArgs(args: unknown): unknown {
  return JSON.parse(JSON.stringify(args, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

function milestoneStatusLabel(status: number): string {
  return ['PENDING', 'SUBMITTED', 'APPROVED', 'RELEASED', 'REFUNDED', 'DISPUTED'][status] ?? 'PENDING';
}

function escrowKindLabel(kind: number): string {
  switch (kind) {
    case EscrowKind.Milestone:
      return 'MILESTONE';
    case EscrowKind.Rental:
      return 'RENTAL';
    case EscrowKind.Service:
      return 'SERVICE';
    case EscrowKind.Lease:
      return 'LEASE';
    case EscrowKind.B2BVendor:
      return 'B2B_VENDOR';
    default:
      return 'UNKNOWN';
  }
}

async function persistEvent(escrowAddress: string, eventName: string, log: any) {
  await prisma.event.create({
    data: {
      escrowAddress,
      eventName,
      blockNumber: log.blockNumber ?? 0n,
      logIndex: Number(log.logIndex ?? 0),
      transactionHash: log.transactionHash,
      args: serializeArgs(log.args) as any,
    },
  });
}

async function seedMilestones(address: Address, protocolVersion: 1 | 2) {
  const abi = protocolVersion === ProtocolVersion.V1 ? MilestoneEscrowV1ABI : MilestoneEscrowV2ABI;

  const milestoneCount = await client.readContract({
    address,
    abi,
    functionName: 'getMilestoneCount',
  }).catch(() => 0n);

  for (let milestoneIndex = 0; milestoneIndex < Number(milestoneCount); milestoneIndex += 1) {
    const milestone = await client.readContract({
      address,
      abi,
      functionName: 'getMilestone',
      args: [BigInt(milestoneIndex)],
    }).catch(() => null) as any;

    if (!milestone) {
      continue;
    }

    await prisma.milestone.upsert({
      where: {
        escrowAddress_index: {
          escrowAddress: address,
          index: milestoneIndex,
        },
      },
      update: {
        amount: milestone.amount.toString(),
        description: milestone.description,
        deadline: milestone.deadline === 0n ? null : new Date(Number(milestone.deadline) * 1000),
        status: milestoneStatusLabel(Number(milestone.status)),
        deliverableHash: milestone.deliverableHash || null,
        disputeId: milestone.disputeId ? milestone.disputeId.toString() : null,
        conditionHash: milestone.conditionHash || null,
      },
      create: {
        escrowAddress: address,
        index: milestoneIndex,
        amount: milestone.amount.toString(),
        description: milestone.description,
        deadline: milestone.deadline === 0n ? null : new Date(Number(milestone.deadline) * 1000),
        status: milestoneStatusLabel(Number(milestone.status)),
        deliverableHash: milestone.deliverableHash || null,
        disputeId: milestone.disputeId ? milestone.disputeId.toString() : null,
        conditionHash: milestone.conditionHash || null,
      },
    });
  }
}

function watchEscrow(address: Address, protocolVersion: 1 | 2) {
  if (watchedEscrows.has(address.toLowerCase())) {
    return;
  }

  watchedEscrows.add(address.toLowerCase());
  const abi = protocolVersion === ProtocolVersion.V1 ? MilestoneEscrowV1ABI : MilestoneEscrowV2ABI;
  console.log(`Watching milestone escrow ${address} (protocol v${protocolVersion})`);

  const logEvent = async (eventName: string, log: any) => {
    await persistEvent(address, eventName, log);
  };

  if (protocolVersion === ProtocolVersion.V1) {
    client.watchContractEvent({
      address,
      abi,
      eventName: 'MilestoneAdded',
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
          await seedMilestones(address, protocolVersion);
          await logEvent('MilestoneAdded', log);
        }
      },
    });
  }

  client.watchContractEvent({
    address,
    abi,
    eventName: 'MilestoneUpdated',
    onLogs: async (logs: any[]) => {
      for (const log of logs) {
        const { milestoneId, amount, description, deadline } = log.args;

        await prisma.milestone.upsert({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          update: {
            amount: amount!.toString(),
            description: description!,
            deadline: Number(deadline) === 0 ? null : new Date(Number(deadline) * 1000),
          },
          create: {
            escrowAddress: address,
            index: Number(milestoneId),
            amount: amount!.toString(),
            description: description!,
            deadline: Number(deadline) === 0 ? null : new Date(Number(deadline) * 1000),
            status: 'PENDING',
          },
        });

        await logEvent('MilestoneUpdated', log);
      }
    },
  });

  client.watchContractEvent({
    address,
    abi,
    eventName: 'MilestoneSubmitted',
    onLogs: async (logs: any[]) => {
      for (const log of logs) {
        const { milestoneId, deliverableHash } = log.args;

        await prisma.milestone.update({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          data: {
            status: 'SUBMITTED',
            deliverableHash: deliverableHash || null,
          },
        });

        await logEvent('MilestoneSubmitted', log);
      }
    },
  });

  client.watchContractEvent({
    address,
    abi,
    eventName: 'MilestoneApproved',
    onLogs: async (logs: any[]) => {
      for (const log of logs) {
        const { milestoneId } = log.args;

        await prisma.milestone.update({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          data: { status: 'APPROVED' },
        });

        await logEvent('MilestoneApproved', log);
      }
    },
  });

  client.watchContractEvent({
    address,
    abi,
    eventName: 'MilestoneReleased',
    onLogs: async (logs: any[]) => {
      for (const log of logs) {
        const { milestoneId } = log.args;

        await prisma.milestone.update({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          data: { status: 'RELEASED' },
        });

        await logEvent('MilestoneReleased', log);
      }
    },
  });

  client.watchContractEvent({
    address,
    abi,
    eventName: 'MilestoneRefunded',
    onLogs: async (logs: any[]) => {
      for (const log of logs) {
        const { milestoneId } = log.args;

        await prisma.milestone.update({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          data: { status: 'REFUNDED' },
        });

        await logEvent('MilestoneRefunded', log);
      }
    },
  });

  client.watchContractEvent({
    address,
    abi,
    eventName: 'DisputeOpened',
    onLogs: async (logs: any[]) => {
      for (const log of logs) {
        const { milestoneId, disputeId } = log.args;

        await prisma.milestone.update({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          data: {
            status: 'DISPUTED',
            disputeId: disputeId!.toString(),
          },
        });

        await prisma.dispute.upsert({
          where: { disputeIdOnChain: disputeId!.toString() },
          update: { status: 'OPEN' },
          create: {
            escrowAddress: address,
            milestoneIndex: Number(milestoneId),
            disputeIdOnChain: disputeId!.toString(),
            status: 'OPEN',
          },
        });

        await logEvent('DisputeOpened', log);
      }
    },
  });

  client.watchContractEvent({
    address,
    abi,
    eventName: 'MilestoneFunded',
    onLogs: async (logs: any[]) => {
      for (const log of logs) {
        await logEvent('MilestoneFunded', log);
      }
    },
  });
}

async function watchExistingEscrows() {
  const escrows = await prisma.escrow.findMany({
    select: { address: true, protocolVersion: true, escrowType: true },
  });

  for (const escrow of escrows) {
    if (escrow.escrowType === 'MILESTONE' || escrow.escrowType === null) {
      watchEscrow(escrow.address as Address, escrow.protocolVersion === 1 ? 1 : 2);
    }
  }
}

async function watchFactories() {
  if (PRIMARY_FACTORY_ADDRESS) {
    console.log(`Watching v2 factory at ${PRIMARY_FACTORY_ADDRESS}`);
    client.watchContractEvent({
      address: PRIMARY_FACTORY_ADDRESS,
      abi: FactoryV2ABI,
      eventName: 'EscrowCreatedV2',
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
          const { escrowAddress, payer, payee, escrowKind, protocolVersion, token, detailsHash } = log.args;

          if (!escrowAddress || !payer || !payee) {
            continue;
          }

          await prisma.escrow.upsert({
            where: { address: escrowAddress },
            update: {
              payer,
              payee,
              factoryAddress: PRIMARY_FACTORY_ADDRESS,
              chainId: CHAIN_ID,
              escrowType: escrowKindLabel(Number(escrowKind)),
              protocolVersion: Number(protocolVersion),
              tokenAddress: token ?? null,
              detailsHash: detailsHash ?? null,
              createdTxHash: log.transactionHash,
            },
            create: {
              address: escrowAddress,
              payer,
              payee,
              factoryAddress: PRIMARY_FACTORY_ADDRESS,
              chainId: CHAIN_ID,
              escrowType: escrowKindLabel(Number(escrowKind)),
              protocolVersion: Number(protocolVersion),
              tokenAddress: token ?? null,
              detailsHash: detailsHash ?? null,
              createdTxHash: log.transactionHash,
            },
          });

          await persistEvent(escrowAddress, 'EscrowCreatedV2', log);

          if (Number(escrowKind) === EscrowKind.Milestone) {
            await seedMilestones(escrowAddress, 2);
            watchEscrow(escrowAddress, 2);
          }
        }
      },
    });
  }

  for (const factoryAddress of LEGACY_FACTORY_ADDRESSES) {
    console.log(`Watching legacy factory at ${factoryAddress}`);

    client.watchContractEvent({
      address: factoryAddress,
      abi: FactoryV1ABI,
      eventName: 'EscrowCreated',
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
          const { escrowAddress, payer, payee, arbiter } = log.args;

          if (!escrowAddress || !payer || !payee) {
            continue;
          }

          await prisma.escrow.upsert({
            where: { address: escrowAddress },
            update: {
              payer,
              payee,
              arbiter: arbiter ?? null,
              factoryAddress: factoryAddress,
              chainId: CHAIN_ID,
              escrowType: 'MILESTONE',
              protocolVersion: ProtocolVersion.V1,
              createdTxHash: log.transactionHash,
            },
            create: {
              address: escrowAddress,
              payer,
              payee,
              arbiter: arbiter ?? null,
              factoryAddress: factoryAddress,
              chainId: CHAIN_ID,
              escrowType: 'MILESTONE',
              protocolVersion: ProtocolVersion.V1,
              createdTxHash: log.transactionHash,
            },
          });

          await persistEvent(escrowAddress, 'EscrowCreated', log);
          watchEscrow(escrowAddress, 1);
        }
      },
    });
  }
}

async function watchVerificationOracle() {
  if (!VERIFICATION_ORACLE_ADDRESS) {
    return;
  }

  console.log(`Watching VerificationOracle at ${VERIFICATION_ORACLE_ADDRESS}`);
  client.watchContractEvent({
    address: VERIFICATION_ORACLE_ADDRESS,
    abi: VerificationOracleABI,
    eventName: 'VerificationAttested',
    onLogs: async (logs: any[]) => {
      for (const log of logs) {
        const { conditionHash, status } = log.args;

        if (status && conditionHash) {
          await prisma.milestone.updateMany({
            where: { conditionHash },
            data: { isVerified: true },
          });
        }
      }
    },
  });
}

async function main() {
  console.log('Indexer starting...');
  console.log(`Selected chain: ${client.chain.name} (${CHAIN_ID})`);

  if (!PRIMARY_FACTORY_ADDRESS && LEGACY_FACTORY_ADDRESSES.length === 0) {
    console.error('Missing factory address configuration');
    process.exit(1);
  }

  await watchExistingEscrows();
  await watchFactories();
  await watchVerificationOracle();
}

main().catch((error) => {
  console.error('Indexer failed to start:', error);
  process.exit(1);
});

async function triggerWebhooks(eventName: string, payload: any) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        events: { has: eventName }
      }
    });

    if (webhooks.length === 0) return;

    console.log(`Triggering ${eventName} for ${webhooks.length} webhooks`);
    const timestamp = Date.now();
    const fullPayload = {
      event: eventName,
      timestamp,
      data: payload
    };
    const payloadString = JSON.stringify(fullPayload);

    for (const webhook of webhooks) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(payloadString)
        .digest('hex');

      console.log(`Prepared webhook for ${webhook.url} with signature ${signature.slice(0, 12)}...`);
    }
  } catch (error) {
    console.error('Failed to trigger webhooks:', error);
  }
}
