import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { hashApiKey } from '../utils/api-key';

describe('ApiKeyGuard', () => {
    it('hashes the incoming API key before lookup', async () => {
        const prisma = {
            apiKey: {
                findUnique: jest.fn().mockResolvedValue({
                    id: 'key-1',
                    ownerId: 'user-1',
                    organizationId: 'org-1',
                    projectId: 'project-1',
                    environmentId: 'env-1',
                    scopes: ['escrows:read'],
                    organization: { id: 'org-1', name: 'Acme', slug: 'acme' },
                    project: { id: 'project-1', name: 'Integration', slug: 'integration' },
                    environment: { id: 'env-1', name: 'Sandbox', slug: 'sandbox', type: 'SANDBOX' },
                    isActive: true,
                }),
                update: jest.fn().mockResolvedValue({}),
            },
        } as any;

        const guard = new ApiKeyGuard(prisma);
        const request: any = { headers: { 'x-api-key': 'sk_test_secret' } };
        const context = {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as any;

        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                environment: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        type: true,
                    },
                },
            },
            where: { keyHash: hashApiKey('sk_test_secret') },
        });
        expect(request.apiKeyOwnerId).toBe('user-1');
        expect(request.apiKeyContext).toEqual(
            expect.objectContaining({
                apiKeyId: 'key-1',
                ownerId: 'user-1',
                organizationId: 'org-1',
                projectId: 'project-1',
                environmentId: 'env-1',
                scopes: ['escrows:read'],
            }),
        );
        expect(prisma.apiKey.update).toHaveBeenCalledWith({
            where: { id: 'key-1' },
            data: { lastUsedAt: expect.any(Date) },
        });
    });

    it('rejects inactive keys', async () => {
        const prisma = {
            apiKey: {
                findUnique: jest.fn().mockResolvedValue(null),
                update: jest.fn(),
            },
        } as any;

        const guard = new ApiKeyGuard(prisma);
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({ headers: { 'x-api-key': 'sk_invalid' } }),
            }),
        } as any;

        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
});
