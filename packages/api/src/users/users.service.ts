import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatUnits } from 'viem';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async getEscrows(address: string, role?: string, status?: string) {
        const where: any = {};

        if (role) {
            where[role] = { equals: address, mode: 'insensitive' };
        } else {
            where.OR = [
                { payer: { equals: address, mode: 'insensitive' } },
                { payee: { equals: address, mode: 'insensitive' } },
                { arbiter: { equals: address, mode: 'insensitive' } }
            ];
        }

        if (status) {
            where.milestones = {
                some: { status: status }
            };
        }

        return this.prisma.escrow.findMany({
            where,
            include: { milestones: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getStats(address: string) {
        const escrows = await this.prisma.escrow.findMany({
            where: {
                OR: [
                    { payer: { equals: address, mode: 'insensitive' } },
                    { payee: { equals: address, mode: 'insensitive' } },
                    { arbiter: { equals: address, mode: 'insensitive' } }
                ]
            },
            include: { milestones: true }
        });

        let totalVolume = BigInt(0);
        let activeEscrows = 0;
        let completedEscrows = 0;

        for (const escrow of escrows) {
            let isCompleted = true;
            for (const milestone of escrow.milestones) {
                totalVolume += BigInt(milestone.amount);
                if (milestone.status !== 'RELEASED' && milestone.status !== 'REFUNDED') {
                    isCompleted = false;
                }
            }

            if (isCompleted && escrow.milestones.length > 0) {
                completedEscrows++;
            } else {
                activeEscrows++;
            }
        }

        return {
            totalVolume: formatUnits(totalVolume, 18), // Assuming 18 decimals for now
            activeEscrows,
            completedEscrows
        };
    }
}
