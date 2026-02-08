import { useReadContract, useReadContracts } from 'wagmi';
import { MILESTONE_ESCROW_ABI } from '@/lib/constants';
import { Address } from 'viem';

export interface Milestone {
    id: number;
    amount: bigint;
    description: string;
    deadline: bigint;
    status: number; // enum (0=PENDING, 1=SUBMITTED, 2=APPROVED, 3=RELEASED, 4=REFUNDED, 5=DISPUTED)
    deliverableHash: string;
    disputeId: bigint;
}

export interface EscrowDetails {
    payer: Address;
    payee: Address;
    arbiter: Address;
    token: Address;
    config: any; // EscrowConfig struct
}

const MILESTONE_STATUS = [
    'PENDING',
    'SUBMITTED',
    'APPROVED',
    'RELEASED',
    'REFUNDED',
    'DISPUTED'
] as const;

export function useEscrow(address: Address | undefined) {
    const { data: countData, isLoading: countLoading } = useReadContract({
        address,
        abi: MILESTONE_ESCROW_ABI,
        functionName: 'getMilestoneCount',
    });

    const count = countData ? Number(countData) : 0;

    // Prepare contracts array for multicall
    const milestoneContracts = Array.from({ length: count }, (_, i) => ({
        address,
        abi: MILESTONE_ESCROW_ABI,
        functionName: 'getMilestone',
        args: [BigInt(i)]
    }));

    const { data: milestonesData, isLoading: milestonesLoading, refetch: refetchMilestones } = useReadContracts({
        contracts: milestoneContracts,
    });

    const { data: payer } = useReadContract({ address, abi: MILESTONE_ESCROW_ABI, functionName: 'payer' });
    const { data: payee } = useReadContract({ address, abi: MILESTONE_ESCROW_ABI, functionName: 'payee' });
    const { data: arbiter } = useReadContract({ address, abi: MILESTONE_ESCROW_ABI, functionName: 'arbiter' });
    const { data: token } = useReadContract({ address, abi: MILESTONE_ESCROW_ABI, functionName: 'token' });
    const { data: config } = useReadContract({ address, abi: MILESTONE_ESCROW_ABI, functionName: 'config' });

    const milestones: Milestone[] = milestonesData?.map((result, index) => {
        if (result.status === 'success' && result.result) {
            const m = result.result as any; // Cast to avoid complex typing issues with ABI output
            return {
                id: index,
                amount: m.amount,
                description: m.description,
                deadline: m.deadline,
                status: m.status,
                deliverableHash: m.deliverableHash,
                disputeId: m.disputeId
            };
        }
        return null;
    }).filter(Boolean) as Milestone[] || [];

    const details: EscrowDetails | undefined = (payer && payee) ? {
        payer: payer as Address,
        payee: payee as Address,
        arbiter: arbiter as Address,
        token: token as Address,
        config
    } : undefined;

    return {
        milestones,
        details,
        isLoading: countLoading || milestonesLoading || !details,
        statusLabels: MILESTONE_STATUS,
        refetch: refetchMilestones
    };
}
