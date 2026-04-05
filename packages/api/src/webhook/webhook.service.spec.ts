import { WebhookDeliveryStatus } from '../generated/prisma';
import { WebhookService } from './webhook.service';

describe('WebhookService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('records a successful delivery when triggering scoped webhooks', async () => {
    const prisma = {
      webhook: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'webhook-1',
            url: 'https://example.com/webhook',
            secret: 'top-secret',
            events: ['escrow.created'],
            ownerId: null,
            organizationId: 'org-1',
            projectId: null,
            environmentId: null,
            headers: null,
          },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
      webhookDelivery: {
        create: jest.fn().mockResolvedValue({
          id: 'delivery-1',
          requestId: 'req-1',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'delivery-1',
          status: WebhookDeliveryStatus.SUCCESS,
          responseStatus: 200,
          deliveredAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      },
    } as any;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('ok'),
    }) as any;

    const service = new WebhookService(prisma);
    const deliveries = await service.trigger(
      'escrow.created',
      { escrowId: 'escrow-1' },
      { organizationId: 'org-1' },
    );

    expect(prisma.webhook.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        events: { has: 'escrow.created' },
        OR: [
          {
            environmentId: null,
            projectId: null,
            organizationId: 'org-1',
          },
        ],
      },
    });
    expect(prisma.webhookDelivery.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          webhookId: 'webhook-1',
          organizationId: 'org-1',
          event: 'escrow.created',
          status: WebhookDeliveryStatus.PENDING,
        }),
      }),
    );
    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'delivery-1' },
        data: expect.objectContaining({
          status: WebhookDeliveryStatus.SUCCESS,
          responseStatus: 200,
          deliveredAt: expect.any(Date),
        }),
      }),
    );
    expect(deliveries).toHaveLength(1);
  });
});
