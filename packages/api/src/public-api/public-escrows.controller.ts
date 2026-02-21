
import { Controller, Get, Param, UseGuards, Request, Post, Body } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/escrows')
@UseGuards(ApiKeyGuard)
export class PublicEscrowsController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async getEscrows(@Request() req: any) {
        const ownerId = req['apiKeyOwnerId'];
        // Assuming API Key owner is linked to a user address somehow, or we use ownerId directly
        // Let's assume for MVP ownerId is the user ID which has an associated address

        // For now, let's just find escrows where payer OR payee creates match the User's address
        // We need to fetch User address first
        const user = await this.prisma.user.findUnique({ where: { id: ownerId } });
        if (!user) return [];

        return this.prisma.escrow.findMany({
            where: {
                OR: [
                    { payer: { equals: user.address, mode: 'insensitive' } },
                    { payee: { equals: user.address, mode: 'insensitive' } },
                ],
            },
            include: {
                milestones: true,
            }
        });
    }

    @Get(':address')
    async getEscrowDetails(@Param('address') address: string) {
        return this.prisma.escrow.findUnique({
            where: { address },
            include: {
                milestones: true,
                disputes: true,
                events: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            },
        });
    }
}
