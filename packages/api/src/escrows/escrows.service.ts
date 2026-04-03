import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscrowsService {
    constructor(private prisma: PrismaService) { }

    async findAll(party?: string, role?: string) {
        if (party) {
            if (role === 'admin') {
                return this.prisma.escrow.findMany({
                    where: { adminAddress: { equals: party, mode: 'insensitive' } },
                    include: { milestones: true, events: { orderBy: [{ blockNumber: 'desc' }, { logIndex: 'desc' }] } }
                });
            } else if (role === 'payer') {
                return this.prisma.escrow.findMany({
                    where: { payer: { equals: party, mode: 'insensitive' } },
                    include: { milestones: true }
                });
            } else if (role === 'payee') {
                return this.prisma.escrow.findMany({
                    where: { payee: { equals: party, mode: 'insensitive' } },
                    include: { milestones: true }
                });
            } else {
                return this.prisma.escrow.findMany({
                    where: {
                        OR: [
                            { payer: { equals: party, mode: 'insensitive' } },
                            { payee: { equals: party, mode: 'insensitive' } },
                            { arbiter: { equals: party, mode: 'insensitive' } },
                            { adminAddress: { equals: party, mode: 'insensitive' } }
                        ]
                    },
                    include: { milestones: true }
                });
            }
        }
        return this.prisma.escrow.findMany({ include: { milestones: true } });
    }

    async findOne(address: string) {
        return this.prisma.escrow.findUnique({
            where: { address },
            include: {
                milestones: true,
                events: { orderBy: [{ blockNumber: 'desc' }, { logIndex: 'desc' }] },
                disputes: true,
            },
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
            orderBy: [{ blockNumber: 'desc' }, { logIndex: 'desc' }]
        });
    }

    async getDisputes(address: string) {
        return this.prisma.dispute.findMany({
            where: { escrowAddress: address }
        });
    }
}
