
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DisputeDialog } from './dispute-dialog';
import '@testing-library/jest-dom';
import { useWriteContract } from 'wagmi';

// Mock Wagmi
jest.mock('wagmi', () => ({
    useReadContract: jest.fn(() => ({ data: BigInt('10000000000000000') })), // 0.01 ETH
    useWriteContract: jest.fn(() => ({ writeContractAsync: jest.fn(), isPending: false })),
    useWaitForTransactionReceipt: jest.fn(() => ({ isLoading: false, isSuccess: false })),
}));

// Mock Sonner
jest.mock('sonner', () => ({
    toast: {
        info: jest.fn(),
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock Lucide
jest.mock('lucide-react', () => ({
    AlertTriangle: () => <span>Alert</span>,
    Loader2: () => <span>Loading</span>,
    Gavel: () => <span>Gavel</span>,
}));

// Mock UI Components
jest.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => <div data-testid="dialog" data-open={open}>{children}</div>,
    DialogTrigger: ({ children }: any) => <div>{children}</div>,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogClose: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

jest.mock('@/components/ui/label', () => ({
    Label: ({ children }: any) => <label>{children}</label>,
}));

jest.mock('@/components/ui/textarea', () => ({
    Textarea: (props: any) => <textarea {...props} />,
}));


describe('DisputeDialog Component', () => {
    it('renders raise dispute button', () => {
        render(
            <DisputeDialog
                escrowAddress="0xEscrow"
                milestoneId={0}
                milestoneIndex={0}
                arbitrationAdapter="0xAdapter"
            />
        );

        expect(screen.getByText('Raise Dispute')).toBeInTheDocument();
    });

    it('opens dialog and shows fee', async () => {
        render(
            <DisputeDialog
                escrowAddress="0xEscrow"
                milestoneId={0}
                milestoneIndex={0}
                arbitrationAdapter="0xAdapter"
            />
        );

        fireEvent.click(screen.getByText('Raise Dispute'));

        expect(await screen.findByText('Raise Dispute for Milestone #1')).toBeInTheDocument();
        // Use getAllByText because fee is shown in display AND button text
        expect(screen.getAllByText(/0.01 ETH/).length).toBeGreaterThan(0);
    });

    it('calls openDispute on confirm', async () => {
        const mockWrite = jest.fn().mockResolvedValue('0xHash');
        (useWriteContract as jest.Mock).mockReturnValue({
            writeContractAsync: mockWrite,
            isPending: false
        });

        render(
            <DisputeDialog
                escrowAddress="0xEscrow"
                milestoneId={0}
                milestoneIndex={0}
                arbitrationAdapter="0xAdapter"
            />
        );

        fireEvent.click(screen.getByText('Raise Dispute'));

        // Wait for dialog to open
        const payBtn = await screen.findByText(/Pay .* Dispute/);
        fireEvent.click(payBtn);

        await waitFor(() => {
            expect(mockWrite).toHaveBeenCalled();
        });
    });
});
