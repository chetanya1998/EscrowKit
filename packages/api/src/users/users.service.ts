import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatUnits } from 'viem';
import * as crypto from 'crypto';
import { hashApiKey, maskApiKey } from '../common/utils/api-key';

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
            include: { milestones: true, disputes: true },
            orderBy: [
                { createdAt: 'desc' },
                { updatedAt: 'desc' }
            ]
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
            include: { milestones: true, disputes: true }
        });

        let totalVolume = BigInt(0);
        let activeEscrows = 0;
        let completedEscrows = 0;
        let activeDisputes = 0;

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

            activeDisputes += escrow.disputes.filter((dispute) => dispute.status === 'OPEN').length;
        }

        const disputeRate = escrows.length > 0
            ? `${((activeDisputes / escrows.length) * 100).toFixed(1)}%`
            : '0%';

        return {
            totalVolume: formatUnits(totalVolume, 18), // Assuming 18 decimals for now
            activeEscrows,
            completedEscrows,
            activeDisputes,
            disputeRate,
        };
    }

    async getProfile(address: string) {
        let user = await this.prisma.user.findUnique({
            where: { address }
        });

        if (!user) {
            // Create user if not exists (for now, during MVP)
            user = await this.prisma.user.create({
                data: { address }
            });
        }
        return user;
    }

    async updateProfile(address: string, data: any) {
        return this.prisma.user.upsert({
            where: { address },
            update: {
                username: data.username,
                email: data.email,
                bio: data.bio,
                avatar: data.avatar,
                preferences: data.preferences,
            },
            create: {
                address,
                username: data.username,
                email: data.email,
                bio: data.bio,
                avatar: data.avatar,
                preferences: data.preferences,
            }
        });
    }

    async generateApiKey(address: string, name: string) {
        const user = await this.getProfile(address);
        const key = 'sk_' + crypto.randomBytes(32).toString('hex');
        const prefix = key.slice(0, 10);
        const lastFour = key.slice(-4);

        const apiKey = await this.prisma.apiKey.create({
            data: {
                keyHash: hashApiKey(key),
                prefix,
                lastFour,
                ownerId: user.id,
                name
            }
        });

        return {
            id: apiKey.id,
            name: apiKey.name,
            key,
            maskedKey: maskApiKey(prefix, lastFour),
            prefix,
            lastFour,
            createdAt: apiKey.createdAt,
        };
    }

    async listApiKeys(address: string) {
        const user = await this.getProfile(address);
        const keys = await this.prisma.apiKey.findMany({
            where: { ownerId: user.id, isActive: true },
            select: { id: true, name: true, createdAt: true, prefix: true, lastFour: true }
        });

        return keys.map((key) => ({
            ...key,
            maskedKey: maskApiKey(key.prefix, key.lastFour),
        }));
    }

    async revokeApiKey(address: string, keyId: string) {
        const user = await this.getProfile(address);
        return this.prisma.apiKey.updateMany({
            where: { id: keyId, ownerId: user.id },
            data: { isActive: false }
        });
    }

    async getDetailedStats(address: string) {
        const user = await this.getProfile(address);
        const escrows = await this.prisma.escrow.findMany({
            where: {
                OR: [
                    { payer: { equals: address, mode: 'insensitive' } },
                    { payee: { equals: address, mode: 'insensitive' } },
                    { arbiter: { equals: address, mode: 'insensitive' } }
                ]
            },
            include: {
                milestones: true,
                disputes: true
            }
        });

        let totalVolume = BigInt(0);
        let activeEscrows = 0;
        let completedEscrows = 0;
        let disputedEscrows = 0;
        let wonDisputes = 0; // Placeholder logic
        let lostDisputes = 0;

        for (const escrow of escrows) {
            let isCompleted = true;
            if (escrow.disputes.length > 0) disputedEscrows++;

            for (const milestone of escrow.milestones) {
                // Approximate 18 decimals
                try {
                    totalVolume += BigInt(milestone.amount);
                } catch (e) { }

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
            totalVolume: totalVolume.toString(),
            activeEscrows,
            completedEscrows,
            disputeCount: disputedEscrows,
            escrowCount: escrows.length
        };
    }
}
