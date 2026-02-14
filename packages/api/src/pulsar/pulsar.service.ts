
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EvidenceService } from '../evidence/evidence.service';
import { createWalletClient, http, publicActions, createPublicClient, getContract, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';

// ABI for VerificationOracle
const VERIFICATION_ORACLE_ABI = [
    {
        "inputs": [
            { "internalType": "bytes32", "name": "_conditionHash", "type": "bytes32" },
            { "internalType": "bool", "name": "_status", "type": "bool" }
        ],
        "name": "attest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

@Injectable()
export class PulsarService {
    private readonly logger = new Logger(PulsarService.name);
    private walletClient;
    private publicClient;

    constructor(
        private readonly prisma: PrismaService,
        private readonly evidence: EvidenceService
    ) {
        // Setup Viem Client (Anvil Account #1 as Verifier)
        // 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
        const account = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');

        this.publicClient = createPublicClient({
            chain: foundry,
            transport: http(process.env.RPC_URL || 'http://127.0.0.1:8545')
        });

        this.walletClient = createWalletClient({
            account,
            chain: foundry,
            transport: http(process.env.RPC_URL || 'http://127.0.0.1:8545')
        }).extend(publicActions);
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async checkPendingVerifications() {
        // Find milestones that have a conditionHash, are SUBMITTED, but NOT verified
        const pending = await this.prisma.milestone.findMany({
            where: {
                status: 'SUBMITTED',
                conditionHash: { not: null },
                isVerified: false
            }
        });

        if (pending.length === 0) return;

        this.logger.log(`Found ${pending.length} pending verifications`);

        for (const m of pending) {
            await this.verifyMilestone(m);
        }
    }

    async verifyMilestone(milestone: any) {
        this.logger.log(`Verifying milestone ${milestone.index} for escrow ${milestone.escrowAddress}`);

        // Mock Verification Logic
        // In real world: Fetch condition JSON from IPFS (milestone.conditionHash)
        // Check criteria against milestone.deliverableHash content

        // For MVP: Auto-approve after a delay
        // We assume if conditionHash exists, it's a valid request

        try {
            const oracleAddress = process.env.VERIFICATION_ORACLE_ADDRESS as `0x${string}`;
            if (!oracleAddress) {
                this.logger.error("VERIFICATION_ORACLE_ADDRESS not set");
                return;
            }

            // Simulate processing time
            this.logger.log(`Attesting to condition ${milestone.conditionHash}...`);

            const { request } = await this.publicClient.simulateContract({
                account: this.walletClient.account,
                address: oracleAddress,
                abi: VERIFICATION_ORACLE_ABI,
                functionName: 'attest',
                args: [milestone.conditionHash as `0x${string}`, true]
            });

            const hash = await this.walletClient.writeContract(request);
            this.logger.log(`Attestation submitted: ${hash}`);

            // Optimistically update DB (Indexer will eventually confirm via event)
            /*
            await this.prisma.milestone.update({
                where: { id: milestone.id },
                data: { isVerified: true }
            });
            */
            // Better to let indexer handle the update from event

        } catch (e) {
            this.logger.error(`Verification failed for ${milestone.id}`, e);
        }
    }
}
