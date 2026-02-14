
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { WebhookService } from './webhook.service';

@Controller('api/v1/webhooks')
@UseGuards(ApiKeyGuard)
export class WebhookController {
    constructor(private webhookService: WebhookService) { }

    @Post()
    async registerWebhook(@Request() req, @Body() body: { url: string, events: string[], secret?: string }) {
        const ownerId = req['apiKeyOwnerId'];
        // Default secret if not provided? Or require it? Let's auto-generate if missing for better UX
        const secret = body.secret || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        return this.webhookService.register(body.url, body.events, secret, ownerId);
    }

    @Get()
    async listWebhooks(@Request() req) {
        const ownerId = req['apiKeyOwnerId'];
        return this.webhookService.list(ownerId);
    }
}
