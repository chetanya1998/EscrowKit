import { ForbiddenException } from '@nestjs/common';
import { MembershipRole } from '../generated/prisma';
import { DeveloperPlatformService } from './developer-platform.service';

describe('DeveloperPlatformService', () => {
  const createPrismaMock = () => {
    const prisma = {
      $transaction: jest.fn(),
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      organization: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      organizationMembership: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      apiKey: {
        create: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(async (callback: any) => callback(prisma));
    return prisma;
  };

  it('creates an organization and assigns the caller as owner', async () => {
    const prisma = createPrismaMock();
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      address: '0xabc',
    });
    prisma.organization.findUnique.mockResolvedValue(null);
    prisma.organization.create.mockResolvedValue({
      id: 'org-1',
      slug: 'acme',
      name: 'Acme',
      description: null,
      metadata: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      _count: {
        apiKeys: 0,
        memberships: 1,
        projects: 0,
        webhooks: 0,
      },
    });
    prisma.organizationMembership.create.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});

    const service = new DeveloperPlatformService(prisma as any, {} as any);
    const result = await service.createOrganization('0xAbC', {
      name: 'Acme',
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'org-1',
        slug: 'acme',
        role: MembershipRole.OWNER,
      }),
    );
    expect(prisma.organizationMembership.create).toHaveBeenCalledWith({
      data: {
        organizationId: 'org-1',
        userId: 'user-1',
        role: MembershipRole.OWNER,
      },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'organization.created',
          organizationId: 'org-1',
          actorUserId: 'user-1',
        }),
      }),
    );
  });

  it('creates a scoped api key for a writable tenant member', async () => {
    const prisma = createPrismaMock();
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      address: '0xabc',
    });
    prisma.organizationMembership.findUnique.mockResolvedValue({
      role: MembershipRole.ADMIN,
      organization: {
        id: 'org-1',
        slug: 'acme',
        name: 'Acme',
        description: null,
        metadata: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        _count: {
          apiKeys: 0,
          memberships: 1,
          projects: 0,
          webhooks: 0,
        },
      },
    });
    prisma.apiKey.create.mockResolvedValue({
      id: 'key-1',
      prefix: 'sk_test123',
      lastFour: 'cdef',
      organizationId: 'org-1',
      projectId: null,
      environmentId: null,
      name: 'Server key',
      description: null,
      scopes: ['escrows:read'],
      metadata: null,
      isActive: true,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      organization: { id: 'org-1', slug: 'acme', name: 'Acme' },
      project: null,
      environment: null,
    });
    prisma.auditLog.create.mockResolvedValue({});

    const service = new DeveloperPlatformService(prisma as any, {} as any);
    const result = await service.createApiKey('0xabc', {
      organizationId: 'org-1',
      name: 'Server key',
      scopes: ['escrows:read'],
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'key-1',
        organizationId: 'org-1',
        scopes: ['escrows:read'],
        key: expect.stringMatching(/^sk_[a-f0-9]{64}$/),
      }),
    );
    expect(prisma.apiKey.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerId: 'user-1',
          createdByUserId: 'user-1',
          organizationId: 'org-1',
          scopes: ['escrows:read'],
        }),
      }),
    );
  });

  it('blocks viewer members from creating api keys', async () => {
    const prisma = createPrismaMock();
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      address: '0xabc',
    });
    prisma.organizationMembership.findUnique.mockResolvedValue({
      role: MembershipRole.VIEWER,
      organization: {
        id: 'org-1',
        slug: 'acme',
        name: 'Acme',
        description: null,
        metadata: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        _count: {
          apiKeys: 0,
          memberships: 1,
          projects: 0,
          webhooks: 0,
        },
      },
    });

    const service = new DeveloperPlatformService(prisma as any, {} as any);

    await expect(
      service.createApiKey('0xabc', {
        organizationId: 'org-1',
        name: 'Viewer key',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
