
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(private prisma: PrismaService) { }

    async register(url: string, events: string[], secret: string, ownerId: string) {
        return this.prisma.webhook.create({
            data: {
                url,
                events,
                secret,
                ownerId,
            }
        });
    }

    async list(ownerId: string) {
        return this.prisma.webhook.findMany({
            where: { ownerId }
        });
    }

    async trigger(event: string, payload: any) {
        // Find all active webhooks subscribed to this event
        // Note: Prisma doesn't support array contains natively on all DBs efficiently, but for MVP fetch all and filter or use raw query.
        // Or better: fetch all active webhooks and filter in memory if list small, or use PostgreSQL specific operator if known PG.
        // schema.prisma provider="postgresql". So we can use `has`? No, prisma client supports `has` for scalar lists.

        const webhooks = await this.prisma.webhook.findMany({
            where: {
                isActive: true,
                events: {
                    has: event
                }
            }
        });

        this.logger.log(`Triggering event ${event} for ${webhooks.length} webhooks`);

        const timestamp = Date.now();
        const fullPayload = {
            event,
            timestamp,
            data: payload
        };

        for (const webhook of webhooks) {
            this.sendWebhook(webhook, fullPayload).catch(err => {
                this.logger.error(`Failed to send webhook to ${webhook.url}: ${err.message}`);
            });
        }
    }

    private async sendWebhook(webhook: any, payload: any) {
        const payloadString = JSON.stringify(payload);

        // Calculate HMAC signature
        const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(payloadString)
            .digest('hex');

        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-EscrowKit-Signature': signature,
                    'X-EscrowKit-Event': payload.event
                },
                body: payloadString
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            this.logger.log(`Webhook sent to ${webhook.url}`);
        } catch (error) {
            throw error;
        }
    }
}
