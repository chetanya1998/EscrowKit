import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
  apiKey: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  escrow: {
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  dispute: {
    count: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateApiKey', () => {
    it('should generate a new API key', async () => {
      const address = '0x123';
      const name = 'Test Key';
      const mockUser = { id: 'user-1', address };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.apiKey.create.mockResolvedValue({ key: 'sk_test_123', name, userId: mockUser.id });

      const result = await service.generateApiKey(address, name);

      expect(result).toHaveProperty('key');
      expect(result.key).toContain('sk_');
      expect(prisma.apiKey.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          ownerId: mockUser.id,
          name,
        })
      }));
    });
  });

  describe('listApiKeys', () => {
    it('should return a list of API keys', async () => {
      const address = '0x123';
      const mockUser = { id: 'user-1', address };
      const mockKeys = [{ id: 'key-1', name: 'Key 1' }];

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.apiKey.findMany.mockResolvedValue(mockKeys);

      const result = await service.listApiKeys(address);

      expect(result).toEqual(mockKeys);
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { ownerId: mockUser.id, isActive: true },
        select: { id: true, name: true, createdAt: true, key: true }
      });
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      const address = '0x123';
      const keyId = 'key-1';
      const mockUser = { id: 'user-1', address };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.apiKey.update.mockResolvedValue({ id: keyId, isActive: false });

      await service.revokeApiKey(address, keyId);

      expect(prisma.apiKey.updateMany).toHaveBeenCalledWith({
        where: { id: keyId, ownerId: mockUser.id },
        data: { isActive: false }
      });
    });
  });
});
