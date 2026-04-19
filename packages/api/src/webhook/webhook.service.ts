import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { Prisma, WebhookDeliveryStatus } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { serializePublicResponse } from '../common/utils/serialize-public-response';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private prisma: PrismaService) {}

  async register(
    url: string,
    events: string[],
    secret: string,
    ownerId: string,
  ) {
    const webhook = await this.prisma.webhook.create({
      data: {
        url,
        events,
        secret,
        secretLastFour: secret.slice(-4),
        ownerId,
      },
    });

    return this.serializeWebhook(webhook, secret);
  }

  async list(ownerId: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { ownerId, isActive: true },
      orderBy: [{ createdAt: 'desc' }],
    });

    return webhooks.map((webhook) => this.serializeWebhook(webhook));
  }

  async trigger(
    event: string,
    payload: any,
    scope?: {
      ownerId?: string;
      organizationId?: string;
      projectId?: string;
      environmentId?: string;
      requestId?: string;
    },
  ) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        isActive: true,
        events: {
          has: event,
        },
        ...(scope ? this.buildScopeWhere(scope) : {}),
      },
    });

    this.logger.log(
      `Triggering event ${event} for ${webhooks.length} webhooks`,
    );

    const timestamp = Date.now();
    const fullPayload = serializePublicResponse({
      event,
      timestamp,
      data: payload,
    });

    return Promise.all(
      webhooks.map((webhook) =>
        this.deliverWebhook(webhook, fullPayload, {
          requestId: scope?.requestId,
        }),
      ),
    );
  }

  async replayDelivery(deliveryId: string, webhookId?: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        webhook: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Webhook delivery not found');
    }

    if (webhookId && delivery.webhookId !== webhookId) {
      throw new NotFoundException('Webhook delivery not found');
    }

    return this.deliverWebhook(
      delivery.webhook,
      delivery.payload,
      {
        attemptCount: delivery.attemptCount + 1,
        requestId: `replay-${delivery.id}-${Date.now()}`,
      },
    );
  }

  async replayLatestDeliveryForWebhook(webhookId: string) {
    const failedDelivery = await this.prisma.webhookDelivery.findFirst({
      where: {
        webhookId,
        status: WebhookDeliveryStatus.FAILED,
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    if (failedDelivery) {
      return this.replayDelivery(failedDelivery.id, webhookId);
    }

    const latestDelivery = await this.prisma.webhookDelivery.findFirst({
      where: { webhookId },
      orderBy: [{ createdAt: 'desc' }],
    });

    if (!latestDelivery) {
      throw new NotFoundException('No webhook deliveries found');
    }

    return this.replayDelivery(latestDelivery.id, webhookId);
  }

  private buildScopeWhere(scope: {
    ownerId?: string;
    organizationId?: string;
    projectId?: string;
    environmentId?: string;
  }) {
    const orFilters: Array<Record<string, unknown>> = [];

    if (scope.environmentId) {
      orFilters.push({ environmentId: scope.environmentId });
    }

    if (scope.projectId) {
      orFilters.push({
        environmentId: null,
        projectId: scope.projectId,
      });
    }

    if (scope.organizationId) {
      orFilters.push({
        environmentId: null,
        projectId: null,
        organizationId: scope.organizationId,
      });
    }

    if (scope.ownerId) {
      orFilters.push({ ownerId: scope.ownerId });
    }

    return orFilters.length > 0 ? { OR: orFilters } : {};
  }

  private async deliverWebhook(
    webhook: any,
    payload: any,
    options?: {
      attemptCount?: number;
      requestId?: string;
    },
  ) {
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        organizationId: webhook.organizationId,
        projectId: webhook.projectId,
        environmentId: webhook.environmentId,
        event: String(payload.event ?? 'unknown'),
        requestId: options?.requestId ?? crypto.randomUUID(),
        status: WebhookDeliveryStatus.PENDING,
        attemptCount: options?.attemptCount ?? 1,
        payload: payload as Prisma.InputJsonValue,
      },
    });

    const payloadString = JSON.stringify(payload);

    // Calculate HMAC signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payloadString)
      .digest('hex');

    try {
      const headers = this.getCustomHeaders(webhook.headers);
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-EscrowKit-Signature': signature,
          'X-EscrowKit-Event': payload.event,
          'X-EscrowKit-Request-Id': delivery.requestId ?? delivery.id,
          'X-EscrowKit-Timestamp': String(payload.timestamp ?? Date.now()),
          ...headers,
        },
        body: payloadString,
      });

      const responseBody = (await response.text()).slice(0, 4000);

      if (!response.ok) {
        const updatedDelivery = await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: WebhookDeliveryStatus.FAILED,
            responseStatus: response.status,
            responseBody,
            errorMessage: `HTTP ${response.status}`,
          },
        });

        await this.prisma.webhook.update({
          where: { id: webhook.id },
          data: { lastTriggeredAt: new Date() },
        }).catch(() => undefined);

        this.logger.error(`Webhook failed for ${webhook.url}: HTTP ${response.status}`);
        return updatedDelivery;
      }

      const updatedDelivery = await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: WebhookDeliveryStatus.SUCCESS,
          responseStatus: response.status,
          responseBody,
          deliveredAt: new Date(),
        },
      });

      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastTriggeredAt: new Date() },
      }).catch(() => undefined);

      this.logger.log(`Webhook sent to ${webhook.url}`);
      return updatedDelivery;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown webhook error';

      const updatedDelivery = await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: WebhookDeliveryStatus.FAILED,
          errorMessage: message,
        },
      });

      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastTriggeredAt: new Date() },
      }).catch(() => undefined);

      this.logger.error(`Failed to send webhook to ${webhook.url}: ${message}`);
      return updatedDelivery;
    }
  }

  private getCustomHeaders(rawHeaders: Prisma.JsonValue | null | undefined) {
    if (!rawHeaders || typeof rawHeaders !== 'object' || Array.isArray(rawHeaders)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(rawHeaders).filter((entry): entry is [string, string] => {
        const [, value] = entry;
        return typeof value === 'string';
      }),
    );
  }

  private serializeWebhook(webhook: any, secret?: string) {
    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      ownerId: webhook.ownerId,
      organizationId: webhook.organizationId,
      projectId: webhook.projectId,
      environmentId: webhook.environmentId,
      description: webhook.description ?? null,
      headers: webhook.headers ?? null,
      isActive: webhook.isActive,
      secretLastFour: webhook.secretLastFour,
      lastTriggeredAt: webhook.lastTriggeredAt,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      ...(secret ? { secret } : {}),
    };
  }
}
