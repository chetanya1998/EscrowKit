import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { hashApiKey } from '../utils/api-key';

describe('ApiKeyGuard', () => {
    it('hashes the incoming API key before lookup', async () => {
        const prisma = {
            apiKey: {
                findUnique: jest.fn().mockResolvedValue({ ownerId: 'user-1', isActive: true }),
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
            where: { keyHash: hashApiKey('sk_test_secret') },
        });
        expect(request.apiKeyOwnerId).toBe('user-1');
    });

    it('rejects inactive keys', async () => {
        const prisma = {
            apiKey: {
                findUnique: jest.fn().mockResolvedValue(null),
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
