import { useReadContract, useReadContracts } from 'wagmi';
import { MILESTONE_ESCROW_ABI, RENTAL_ESCROW_ABI } from '@/lib/constants';
import { Address } from 'viem';

export interface Milestone {
    id: number;
    amount: bigint;
    description: string;
    deadline: bigint;
    status: number; // enum (0=PENDING, 1=SUBMITTED, 2=APPROVED, 3=RELEASED, 4=REFUNDED, 5=DISPUTED)
    deliverableHash: string;
    disputeId: bigint;
    conditionHash: string;
}

export interface EscrowDetails {
    payer: Address;
    payee: Address;
    arbiter: Address;
    token: Address;
    arbitrationAdapter: Address;
    config: any; // EscrowConfig struct
}

export interface RentalDetails {
    depositAmount: bigint;
    claimAmount: bigint;
    claimDeadline: bigint;
    status: number; // enum (0=ACTIVE, 1=CLAIMED, 2=DISPUTED, 3=RESOLVED)
    config: any; // RentalConfig
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
    // 1. Try to fetch Milestone Count (Milestone Escrow)
    const { data: countData, error: countError } = useReadContract({
        address,
        abi: MILESTONE_ESCROW_ABI,
        functionName: 'getMilestoneCount',
    });

    // 2. Try to fetch Deposit Amount (Rental Escrow)
    const { data: depositData, error: depositError } = useReadContract({
        address,
        abi: RENTAL_ESCROW_ABI,
        functionName: 'depositAmount',
    });

    const isRental = !!depositData || (!!depositError && !countError === false && !countData); // Heuristic: valid deposit data means rental
    // Better heuristic: if countData is undefined/error AND depositData is valid, it's Rental.

    const type = depositData !== undefined ? 'rental' : countData !== undefined ? 'milestone' : 'loading';

    // --- Milestone Escrow Logic ---
    const count = countData ? Number(countData) : 0;
    const milestoneContracts = Array.from({ length: count }, (_, i) => ({
        address,
        abi: MILESTONE_ESCROW_ABI,
        functionName: 'milestones',
        args: [BigInt(i)]
    }));

    const { data: milestonesData, refetch: refetchMilestones } = useReadContracts({
        contracts: milestoneContracts,
        query: { enabled: type === 'milestone' }
    });

    const milestones: Milestone[] = milestonesData?.map((result, index) => {
        if (result.status === 'success' && result.result) {
            // result.result is an array/tuple now: 
            // [amount, description, deadline, status, deliverableHash, disputeId, conditionHash]
            const m = result.result as any;
            // Wagmi/Viem typically returns an array for structs if no proper type mapping, 
            // or an object if ABI has names. 
            // Given the complexity, let's assume it returns an array access or object access.
            // With 'readContract' on ABI artifacts, it usually returns an array/object.
            // Let's safe guard.

            // Check if m is array or object. 
            // Typically with recent Viem it returns an array if names are present but sometimes it's object.
            // Let's assume array for safety based on `Escrowflow.t.sol` usage, but typical Viem read returns named object if ABI has names.
            // Forge artifacts usually have names.

            return {
                id: index,
                amount: m[0] || m.amount, // Fallback
                description: m[1] || m.description,
                deadline: m[2] || m.deadline,
                status: m[3] || m.status,
                deliverableHash: m[4] || m.deliverableHash,
                disputeId: m[5] || m.disputeId,
                conditionHash: m[6] || m.conditionHash,
            };
        }
        return null;
    }).filter(Boolean) as Milestone[] || [];


    // --- Rental Escrow Logic ---
    const { data: rentalStatus, refetch: refetchStatus } = useReadContract({
        address, abi: RENTAL_ESCROW_ABI, functionName: 'status', query: { enabled: type === 'rental' }
    });
    const { data: claimAmount } = useReadContract({
        address, abi: RENTAL_ESCROW_ABI, functionName: 'claimAmount', query: { enabled: type === 'rental' }
    });
    const { data: claimDeadline } = useReadContract({
        address, abi: RENTAL_ESCROW_ABI, functionName: 'claimDeadline', query: { enabled: type === 'rental' }
    });


    // --- Shared Details (Payer, Payee, Arbiter) ---
    // Both contracts have these fields. We can use MILESTONE_ABI for both if signatures match,
    // but safer to use the correct ABI based on type.
    const activeABI = type === 'rental' ? RENTAL_ESCROW_ABI : MILESTONE_ESCROW_ABI;

    const { data: payer } = useReadContract({ address, abi: activeABI, functionName: 'payer' });
    const { data: payee } = useReadContract({ address, abi: activeABI, functionName: 'payee' });
    const { data: arbiter } = useReadContract({ address, abi: activeABI, functionName: 'arbiter' });
    const { data: token } = useReadContract({ address, abi: activeABI, functionName: 'token' });
    const { data: config } = useReadContract({ address, abi: activeABI, functionName: 'config' });
    const { data: arbitrationAdapter } = useReadContract({ address, abi: activeABI, functionName: 'arbitrationAdapter' });

    const details: EscrowDetails | undefined = (payer && payee) ? {
        payer: payer as Address,
        payee: payee as Address,
        arbiter: arbiter as Address,
        token: token as Address,
        arbitrationAdapter: arbitrationAdapter as Address,
        config
    } : undefined;

    const rentalDetails: RentalDetails | undefined = (type === 'rental' && depositData !== undefined) ? {
        depositAmount: depositData as bigint,
        claimAmount: (claimAmount as bigint) || 0n,
        claimDeadline: (claimDeadline as bigint) || 0n,
        status: Number(rentalStatus || 0),
        config
    } : undefined;

    return {
        type,
        milestones,
        rentalDetails,
        details,
        isLoading: !type || type === 'loading' || !details,
        isError: !!countError || !!depositError,
        statusLabels: MILESTONE_STATUS,
        refetch: () => { refetchMilestones(); refetchStatus(); }
    };
}
