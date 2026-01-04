import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscrowsService {
    constructor(private prisma: PrismaService) { }

    async findAll(party?: string) {
        if (party) {
            return this.prisma.escrow.findMany({
                where: {
                    OR: [
                        { payer: { equals: party, mode: 'insensitive' } },
                        { payee: { equals: party, mode: 'insensitive' } },
                        { arbiter: { equals: party, mode: 'insensitive' } }
                    ]
                },
                include: { milestones: true }
            });
        }
        return this.prisma.escrow.findMany({ include: { milestones: true } });
    }

    async findOne(address: string) {
        return this.prisma.escrow.findUnique({
            where: { address },
            include: { milestones: true, events: true, disputes: true },
        });
    }

    async getMilestones(address: string) {
        return this.prisma.milestone.findMany({
            where: { escrowAddress: address },
            orderBy: { index: 'asc' }
        });
    }

    async getEvents(address: string) {
        return this.prisma.event.findMany({
            where: { escrowAddress: address },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getDisputes(address: string) {
        return this.prisma.dispute.findMany({
            where: { escrowAddress: address }
        });
    }
}
