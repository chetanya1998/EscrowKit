import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscrowsService {
    constructor(private prisma: PrismaService) { }

    async findAll(party?: string, role?: string, environmentId?: string, projectId?: string) {
        const whereClause: any = {};
        
        if (environmentId) {
            whereClause.environmentId = environmentId;
        } else if (projectId) {
            whereClause.projectId = projectId;
        }

        if (party) {
            if (role === 'admin') {
                return this.prisma.escrow.findMany({
                    where: { ...whereClause, adminAddress: { equals: party, mode: 'insensitive' } },
                    include: { milestones: true, events: { orderBy: [{ blockNumber: 'desc' }, { logIndex: 'desc' }] } },
                    orderBy: { createdAt: 'desc' }
                });
            } else if (role === 'payer') {
                return this.prisma.escrow.findMany({
                    where: { ...whereClause, payer: { equals: party, mode: 'insensitive' } },
                    include: { milestones: true },
                    orderBy: { createdAt: 'desc' }
                });
            } else if (role === 'payee') {
                return this.prisma.escrow.findMany({
                    where: { ...whereClause, payee: { equals: party, mode: 'insensitive' } },
                    include: { milestones: true },
                    orderBy: { createdAt: 'desc' }
                });
            } else {
                return this.prisma.escrow.findMany({
                    where: {
                        ...whereClause,
                        OR: [
                            { payer: { equals: party, mode: 'insensitive' } },
                            { payee: { equals: party, mode: 'insensitive' } },
                            { arbiter: { equals: party, mode: 'insensitive' } },
                            { adminAddress: { equals: party, mode: 'insensitive' } }
                        ]
                    },
                    include: { milestones: true },
                    orderBy: { createdAt: 'desc' }
                });
            }
        }
        return this.prisma.escrow.findMany({ 
            where: whereClause,
            include: { milestones: true }, 
            orderBy: { createdAt: 'desc' }
        });
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
