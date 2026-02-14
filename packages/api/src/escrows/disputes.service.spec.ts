
import { Test, TestingModule } from '@nestjs/testing';
import { DisputesService } from './disputes.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock viem
jest.mock('viem', () => ({
    encodeFunctionData: jest.fn(() => '0xEncodedData'),
}));

const mockPrismaService = {
    dispute: {
        updateMany: jest.fn(),
    },
};

describe('DisputesService', () => {
    let service: DisputesService;
    let prisma: typeof mockPrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DisputesService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<DisputesService>(DisputesService);
        prisma = module.get(PrismaService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getEvidenceCalldata', () => {
        it('should return encoded calldata for evidence submission', () => {
            const adapterAddress = '0xAdapter';
            const disputeId = 1;
            const evidenceUrl = 'ipfs://QmHash';

            const result = service.getEvidenceCalldata(adapterAddress, disputeId, evidenceUrl);

            expect(result).toEqual({
                to: adapterAddress,
                data: '0xEncodedData'
            });
        });
    });

    describe('processRuling', () => {
        it('should verify ruling and update dispute status', async () => {
            const disputeId = 123;
            const ruling = 1;
            const escrowAddress = '0xEscrow';

            mockPrismaService.dispute.updateMany.mockResolvedValue({ count: 1 });

            const result = await service.processRuling(disputeId, ruling, escrowAddress);

            expect(result).toEqual({ success: true });
            expect(prisma.dispute.updateMany).toHaveBeenCalledWith({
                where: {
                    disputeIdOnChain: disputeId.toString(),
                    escrowAddress: escrowAddress
                },
                data: {
                    status: 'RESOLVED'
                }
            });
        });
    });
});
