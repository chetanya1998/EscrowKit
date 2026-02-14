
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MilestoneProposal } from './milestone-proposal';
import '@testing-library/jest-dom';

// Mock Wagmi
jest.mock('wagmi', () => ({
    useAccount: jest.fn(() => ({ address: '0xPayer' })),
    useSignTypedData: jest.fn(() => ({ signTypedDataAsync: jest.fn() })),
    useWriteContract: jest.fn(() => ({ writeContractAsync: jest.fn(), data: null, isPending: false })),
    useWaitForTransactionReceipt: jest.fn(() => ({ isLoading: false, isSuccess: false })),
}));

// Mock Sonner Toast
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock Lucide
jest.mock('lucide-react', () => ({
    Plus: () => <span>Plus</span>,
    PenTool: () => <span>PenTool</span>,
    CheckCircle: () => <span>CheckCircle</span>,
    XCircle: () => <span>XCircle</span>,
    Loader2: () => <span>Loader2</span>,
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

jest.mock('@/components/ui/card', () => ({
    Card: ({ children }: any) => <div>{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardTitle: ({ children }: any) => <div>{children}</div>,
    CardDescription: ({ children }: any) => <div>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
}));

jest.mock('@/components/ui/input', () => ({
    Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/textarea', () => ({
    Textarea: (props: any) => <textarea {...props} />,
}));

// Mock Fetch
global.fetch = jest.fn();

describe('MilestoneProposal Component', () => {
    const mockDrafts = [
        {
            id: 'draft-1',
            title: 'Design Phase',
            description: 'Initial designs',
            amount: '1.0',
            deadline: new Date().toISOString(),
            status: 'PENDING',
            isSigned: false,
            creator: '0xPayer'
        }
    ];

    beforeEach(() => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockDrafts,
        });
    });

    it('renders milestones list', async () => {
        render(<MilestoneProposal escrowAddress="0xEscrow" role="payer" />);

        expect(await screen.findByText('Milestone Proposals')).toBeInTheDocument();
        expect(await screen.findByText('Design Phase')).toBeInTheDocument();
    });

    it('allows payer to open creation dialog', async () => {
        render(<MilestoneProposal escrowAddress="0xEscrow" role="payer" />);

        // Need to wait for fetch to settle
        await waitFor(() => expect(screen.getByText('Milestone Proposals')).toBeInTheDocument());

        const newProposalBtn = screen.getByText('New Proposal');
        fireEvent.click(newProposalBtn);

        expect(screen.getByText('Propose New Milestone')).toBeInTheDocument();
    });
});
