
import { Test, TestingModule } from '@nestjs/testing';
import { MilestoneDraftsService } from './milestone-drafts.service';
import { PrismaService } from '../prisma/prisma.service';
import { verifyTypedData } from 'viem';

// Mock viem
jest.mock('viem', () => ({
    verifyTypedData: jest.fn(),
    parseEther: jest.fn((val) => val), // Simple pass-through for test
}));

const mockPrismaService = {
    milestoneDraft: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    },
};

describe('MilestoneDraftsService', () => {
    let service: MilestoneDraftsService;
    let prisma: typeof mockPrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MilestoneDraftsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<MilestoneDraftsService>(MilestoneDraftsService);
        prisma = module.get(PrismaService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createDraft', () => {
        it('should create a draft', async () => {
            const draftData = {
                escrowAddress: '0x123',
                title: 'Test Draft',
                description: 'Desc',
                amount: '1.0',
                deadline: new Date(),
                creator: '0xCreator',
            };

            prisma.milestoneDraft.create.mockResolvedValue({ id: 'draft-1', ...draftData, status: 'PENDING' });

            await service.createDraft(draftData);

            expect(prisma.milestoneDraft.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    ...draftData,
                    status: 'PENDING',
                    isSigned: false
                })
            });
        });
    });

    describe('signDraft', () => {
        it('should verify signature and sign draft', async () => {
            const id = 'draft-1';
            const signature = '0xSig';
            const signerAddress = '0xSigner';
            const draft = {
                id,
                title: 'Title',
                description: 'Desc',
                amount: '1.0',
                deadline: new Date(),
                escrowAddress: '0xEscrow'
            };

            prisma.milestoneDraft.findUnique.mockResolvedValue(draft);
            (verifyTypedData as jest.Mock).mockResolvedValue(true);
            prisma.milestoneDraft.update.mockResolvedValue({ ...draft, isSigned: true, status: 'SIGNED' });

            await service.signDraft(id, signature, signerAddress);

            expect(verifyTypedData).toHaveBeenCalled();
            expect(prisma.milestoneDraft.update).toHaveBeenCalledWith({
                where: { id },
                data: {
                    isSigned: true,
                    signature,
                    status: 'SIGNED'
                }
            });
        });

        it('should throw error if signature invalid', async () => {
            const id = 'draft-1';
            const draft = { id, title: 'Title', amount: '1.0', deadline: new Date(), escrowAddress: '0xEscrow' };

            prisma.milestoneDraft.findUnique.mockResolvedValue(draft);
            (verifyTypedData as jest.Mock).mockResolvedValue(false);

            await expect(service.signDraft(id, '0xBadSig', '0xSigner')).rejects.toThrow('Invalid Signature');
        });
    });

    describe('rejectDraft', () => {
        it('should update status to REJECTED', async () => {
            const id = 'draft-1';
            prisma.milestoneDraft.update.mockResolvedValue({ id, status: 'REJECTED' });

            await service.rejectDraft(id);

            expect(prisma.milestoneDraft.update).toHaveBeenCalledWith({
                where: { id },
                data: { status: 'REJECTED' }
            });
        });
    });
});
