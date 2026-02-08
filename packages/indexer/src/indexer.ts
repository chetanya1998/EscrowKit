import { createPublicClient, http, parseAbiItem } from 'viem';
import { foundry } from 'viem/chains';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import {
  EscrowFactoryABI,
  MilestoneEscrowABI
} from './abis';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Use Anvil chain (local) or configure via ENV
const client = createPublicClient({
  chain: foundry,
  transport: http(process.env.RPC_URL || 'http://127.0.0.1:8545'),
});

const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS as `0x${string}`;

async function main() {
  console.log('Indexer starting...');
  console.log('Connecting to RPC:', client.chain.name);

  if (!FACTORY_ADDRESS) {
    console.error("Missing FACTORY_ADDRESS in .env");
    process.exit(1);
  }

  // Watch for EscrowCreated events
  console.log(`Watching Factory at ${FACTORY_ADDRESS}`);

  client.watchContractEvent({
    address: FACTORY_ADDRESS,
    abi: EscrowFactoryABI,
    eventName: 'EscrowCreated',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { escrowAddress, payer, payee, arbiter } = log.args;
        console.log(`New Escrow: ${escrowAddress}`);

        try {
          // Create Escrow in DB
          await prisma.escrow.upsert({
            where: { address: escrowAddress! },
            update: {},
            create: {
              address: escrowAddress!,
              payer: payer!,
              payee: payee!,
              arbiter: arbiter || null,
              factoryAddress: FACTORY_ADDRESS,
              // Arbitration Adapter logic could be added if event emits it or we fetch it
            }
          });

          // Start watching this new escrow instance
          watchEscrow(escrowAddress!);

          // Add Event Log
          await prisma.event.create({
            data: {
              escrowAddress: escrowAddress!,
              eventName: 'EscrowCreated',
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              args: JSON.parse(JSON.stringify(log.args, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
              ))
            }
          });

        } catch (e) {
          console.error('Error indexing escrow:', e);
        }
      }
    }
  });
}

function watchEscrow(address: `0x${string}`) {
  console.log(`Watching Escrow instance: ${address}`);

  // Helper to log generic event
  const logEvent = async (eventName: string, log: any) => {
    await prisma.event.create({
      data: {
        escrowAddress: address,
        eventName: eventName,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        args: JSON.parse(JSON.stringify(log.args, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        ))
      }
    });
  };

  // MilestoneAdded
  client.watchContractEvent({
    address,
    abi: MilestoneEscrowABI,
    eventName: 'MilestoneAdded',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { milestoneId, amount } = log.args;
        console.log(`Milestone Added: ${milestoneId} on ${address}`);

        try {
          // Fetch full milestone details
          const milestoneData = await client.readContract({
            address,
            abi: MilestoneEscrowABI,
            functionName: 'getMilestone',
            args: [milestoneId!]
          });

          await prisma.milestone.create({
            data: {
              escrowAddress: address,
              index: Number(milestoneId),
              amount: amount!.toString(),
              description: milestoneData.description,
              deadline: new Date(Number(milestoneData.deadline) * 1000),
              status: 'PENDING',
            }
          });

          await logEvent('MilestoneAdded', log);

        } catch (e) {
          console.error(`Error indexing MilestoneAdded for ${address}:`, e);
        }
      }
    }
  });

  // MilestoneSubmitted
  client.watchContractEvent({
    address,
    abi: MilestoneEscrowABI,
    eventName: 'MilestoneSubmitted',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { milestoneId, deliverableHash } = log.args;
        console.log(`Milestone Submitted: ${milestoneId}`);

        await prisma.milestone.update({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          data: {
            status: 'SUBMITTED',
            deliverableHash: deliverableHash || null
          }
        });
        await logEvent('MilestoneSubmitted', log);
      }
    }
  });

  // MilestoneApproved
  client.watchContractEvent({
    address,
    abi: MilestoneEscrowABI,
    eventName: 'MilestoneApproved',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { milestoneId } = log.args;
        console.log(`Milestone Approved: ${milestoneId}`);

        await prisma.milestone.update({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          data: { status: 'APPROVED' }
        });
        await logEvent('MilestoneApproved', log);
      }
    }
  });

  // MilestoneReleased
  client.watchContractEvent({
    address,
    abi: MilestoneEscrowABI,
    eventName: 'MilestoneReleased',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { milestoneId } = log.args;
        console.log(`Milestone Released: ${milestoneId}`);

        await prisma.milestone.update({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          data: { status: 'RELEASED' }
        });
        await logEvent('MilestoneReleased', log);
      }
    }
  });

  // MilestoneRefunded
  client.watchContractEvent({
    address,
    abi: MilestoneEscrowABI,
    eventName: 'MilestoneRefunded',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { milestoneId } = log.args;
        console.log(`Milestone Refunded: ${milestoneId}`);

        await prisma.milestone.update({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          data: { status: 'REFUNDED' }
        });
        await logEvent('MilestoneRefunded', log);
      }
    }
  });

  // DisputeOpened
  client.watchContractEvent({
    address,
    abi: MilestoneEscrowABI,
    eventName: 'DisputeOpened',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { milestoneId, disputeId } = log.args;
        console.log(`Dispute Opened: ${milestoneId}`);

        // Update milestone status
        await prisma.milestone.update({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          data: { status: 'DISPUTED', disputeId: disputeId!.toString() }
        });

        // Create Dispute record
        await prisma.dispute.create({
          data: {
            escrowAddress: address,
            milestoneIndex: Number(milestoneId),
            disputeIdOnChain: disputeId!.toString(),
            status: 'OPEN',
          }
        });
        await logEvent('DisputeOpened', log);
      }
    }
  });

  // Also log Funding
  client.watchContractEvent({
    address,
    abi: MilestoneEscrowABI,
    eventName: 'MilestoneFunded',
    onLogs: async (logs) => {
      for (const log of logs) {
        await logEvent('MilestoneFunded', log);
      }
    }
  });

  // MilestoneUpdated
  client.watchContractEvent({
    address,
    abi: MilestoneEscrowABI,
    eventName: 'MilestoneUpdated',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { milestoneId, amount, description, deadline } = log.args;
        console.log(`Milestone Updated: ${milestoneId}`);

        await prisma.milestone.update({
          where: { escrowAddress_index: { escrowAddress: address, index: Number(milestoneId) } },
          data: {
            amount: amount!.toString(),
            description: description!,
            deadline: new Date(Number(deadline) * 1000)
          }
        });
        await logEvent('MilestoneUpdated', log);
      }
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
