
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { verifyTypedData, parseEther } from 'viem';

@Injectable()
export class MilestoneDraftsService {
    constructor(private prisma: PrismaService) { }

    async createDraft(data: { escrowAddress: string, title: string, description: string, amount: string, deadline: Date, creator: string, index?: number }) {
        return this.prisma.milestoneDraft.create({
            data: {
                ...data,
                status: 'PENDING',
                isSigned: false
            }
        });
    }

    async getDrafts(escrowAddress: string) {
        return this.prisma.milestoneDraft.findMany({
            where: { escrowAddress },
            orderBy: { createdAt: 'desc' }
        });
    }

    async signDraft(id: string, signature: string, signerAddress: string) {
        const draft = await this.prisma.milestoneDraft.findUnique({ where: { id } });
        if (!draft) throw new BadRequestException('Draft not found');

        // Verify Signature (EIP-712)
        // We construct the same data payload that the frontend signed
        const domain = {
            name: 'EscrowKit',
            version: '1',
            chainId: 31337, // Localhost Anvil. In prod, use env variable
            verifyingContract: draft.escrowAddress as `0x${string}`
        } as const;

        const types = {
            Milestone: [
                { name: 'title', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'amount', type: 'uint256' },
                { name: 'deadline', type: 'uint256' }
            ]
        } as const;

        const message = {
            title: draft.title,
            description: draft.description,
            amount: parseEther(draft.amount), // Amount in Wei
            deadline: BigInt(Math.floor(draft.deadline.getTime() / 1000))
        };

        const valid = await verifyTypedData({
            address: signerAddress as `0x${string}`,
            domain,
            types,
            primaryType: 'Milestone',
            message,
            signature: signature as `0x${string}`
        });

        if (!valid) throw new BadRequestException('Invalid Signature');

        return this.prisma.milestoneDraft.update({
            where: { id },
            data: {
                isSigned: true,
                signature,
                status: 'SIGNED'
            }
        });
    }

    async rejectDraft(id: string) {
        return this.prisma.milestoneDraft.update({
            where: { id },
            data: { status: 'REJECTED' }
        });
    }
}
