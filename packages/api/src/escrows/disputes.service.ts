
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encodeFunctionData } from 'viem';

// Minimal ABI for Kleros Adapter interaction
const KLEROS_ADAPTER_ABI = [
    {
        name: 'submitEvidence',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_disputeID', type: 'uint256' },
            { name: '_evidence', type: 'string' }
        ],
        outputs: []
    },
    {
        name: 'rule',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_disputeID', type: 'uint256' },
            { name: '_ruling', type: 'uint256' }
        ],
        outputs: []
    }
] as const;

@Injectable()
export class DisputesService {
    constructor(private prisma: PrismaService) { }

    // Helper to get calldata for submitting evidence
    getEvidenceCalldata(adapterAddress: string, disputeId: number, evidenceUrl: string) {
        // Here we could upload 'evidenceUrl' content to IPFS if it's raw text/file
        // For now, assume evidenceUrl is the IPFS hash or link
        const data = encodeFunctionData({
            abi: KLEROS_ADAPTER_ABI,
            functionName: 'submitEvidence',
            args: [BigInt(disputeId), evidenceUrl]
        });

        return {
            to: adapterAddress,
            data
        };
    }

    // Process generic webhook for ruling (simulating centralized arbitrator or bridge)
    async processRuling(disputeId: number, ruling: number, escrowAddress: string) {
        // Update local DB status to 'RESOLVED' if not already
        // In reality, indexer listens to 'Ruling' event. 
        // This endpoint might be used to FORCE update or log it.

        await this.prisma.dispute.updateMany({
            where: {
                disputeIdOnChain: disputeId.toString(),
                escrowAddress: escrowAddress
            },
            data: {
                status: 'RESOLVED'
            }
        });

        return { success: true };
    }
}
