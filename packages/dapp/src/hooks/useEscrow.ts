import { useReadContract, useReadContracts } from 'wagmi';
import { MILESTONE_ESCROW_ABI, RENTAL_ESCROW_ABI, SERVICE_ESCROW_ABI, LEASE_ESCROW_ABI } from '@/lib/constants';
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
    config: unknown; // EscrowConfig struct (varies by type)
}

export interface RentalDetails {
    depositAmount: bigint;
    claimAmount: bigint;
    claimDeadline: bigint;
    status: number; // enum (0=ACTIVE, 1=CLAIMED, 2=DISPUTED, 3=RESOLVED)
}

export interface ServiceDetails {
    depositAmount: bigint;
    status: number; // 0=PENDING, 1=FUNDED, 2=SUBMITTED, 3=APPROVED, 4=RELEASED, 5=REFUNDED, 6=DISPUTED
    submittedAt: bigint;
    deliverableHash: string;
}

export interface LeaseDetails {
    totalDeposited: bigint;
    currentPeriod: bigint;
    status: number; // 0=AWAITING_DEPOSIT, 1=ACTIVE, 2=DISPUTED, 3=ENDED
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

    // 2. Try to fetch payer & payee (Shared by Milestone & Rental)
    const { data: payerData } = useReadContract({
        address,
        abi: MILESTONE_ESCROW_ABI, // works for rental too since both have 'payer'
        functionName: 'payer',
    });

    // 3. Try to fetch buyer (Service Escrow)
    const { data: buyerData } = useReadContract({
        address,
        abi: SERVICE_ESCROW_ABI,
        functionName: 'buyer',
    });

    // 4. Try to fetch lessee (Lease Escrow)
    const { data: lesseeData } = useReadContract({
        address,
        abi: LEASE_ESCROW_ABI,
        functionName: 'lessee',
    });

    // Heuristic Classification
    let type: 'milestone' | 'rental' | 'service' | 'lease' | 'loading' = 'loading';
    if (buyerData) {
        type = 'service';
    } else if (lesseeData) {
        type = 'lease';
    } else if (payerData) {
        // Distinguish between milestone and rental
        if (countError === null && countData !== undefined) {
            type = 'milestone';
        } else {
            type = 'rental';
        }
    } else if (countError) {
        // Fallback or still loading
        type = 'loading';
    }

    // --- MILESTONE ESCROW LOGIC ---
    const count = type === 'milestone' && countData ? Number(countData) : 0;
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const m = result.result as any;
            return {
                id: index,
                amount: m[0] || m.amount,
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

    // --- RENTAL ESCROW LOGIC ---
    const { data: rentalDeposit, refetch: refetchRental1 } = useReadContract({
        address, abi: RENTAL_ESCROW_ABI, functionName: 'depositAmount', query: { enabled: type === 'rental' }
    });
    const { data: rentalStatus, refetch: refetchRental2 } = useReadContract({
        address, abi: RENTAL_ESCROW_ABI, functionName: 'status', query: { enabled: type === 'rental' }
    });
    const { data: rentalClaimAmount } = useReadContract({
        address, abi: RENTAL_ESCROW_ABI, functionName: 'claimAmount', query: { enabled: type === 'rental' }
    });
    const { data: rentalClaimDeadline } = useReadContract({
        address, abi: RENTAL_ESCROW_ABI, functionName: 'claimDeadline', query: { enabled: type === 'rental' }
    });

    const rentalDetails: RentalDetails | undefined = type === 'rental' && rentalDeposit !== undefined ? {
        depositAmount: rentalDeposit as bigint,
        claimAmount: (rentalClaimAmount as bigint) || 0n,
        claimDeadline: (rentalClaimDeadline as bigint) || 0n,
        status: Number(rentalStatus || 0),
    } : undefined;

    // --- SERVICE ESCROW LOGIC ---
    const { data: serviceDeposit, refetch: refetchService1 } = useReadContract({
        address, abi: SERVICE_ESCROW_ABI, functionName: 'depositAmount', query: { enabled: type === 'service' }
    });
    const { data: serviceStatus, refetch: refetchService2 } = useReadContract({
        address, abi: SERVICE_ESCROW_ABI, functionName: 'status', query: { enabled: type === 'service' }
    });
    const { data: serviceSubmittedAt } = useReadContract({
        address, abi: SERVICE_ESCROW_ABI, functionName: 'submittedAt', query: { enabled: type === 'service' }
    });
    const { data: serviceDeliverableHash } = useReadContract({
        address, abi: SERVICE_ESCROW_ABI, functionName: 'deliverableHash', query: { enabled: type === 'service' }
    });

    const serviceDetails: ServiceDetails | undefined = type === 'service' && serviceDeposit !== undefined ? {
        depositAmount: serviceDeposit as bigint,
        status: Number(serviceStatus || 0),
        submittedAt: (serviceSubmittedAt as bigint) || 0n,
        deliverableHash: (serviceDeliverableHash as string) || "",
    } : undefined;

    // --- LEASE ESCROW LOGIC ---
    const { data: leaseTotalDeposited, refetch: refetchLease1 } = useReadContract({
        address, abi: LEASE_ESCROW_ABI, functionName: 'totalDeposited', query: { enabled: type === 'lease' }
    });
    const { data: leaseStatus, refetch: refetchLease2 } = useReadContract({
        address, abi: LEASE_ESCROW_ABI, functionName: 'status', query: { enabled: type === 'lease' }
    });
    const { data: leaseCurrentPeriod } = useReadContract({
        address, abi: LEASE_ESCROW_ABI, functionName: 'currentPeriod', query: { enabled: type === 'lease' }
    });

    const leaseDetails: LeaseDetails | undefined = type === 'lease' && leaseTotalDeposited !== undefined ? {
        totalDeposited: leaseTotalDeposited as bigint,
        status: Number(leaseStatus || 0),
        currentPeriod: (leaseCurrentPeriod as bigint) || 0n,
    } : undefined;


    // --- SHARED DETAILS (Generic Mapping) ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let activeABI: any = MILESTONE_ESCROW_ABI;
    if (type === 'rental') activeABI = RENTAL_ESCROW_ABI;
    if (type === 'service') activeABI = SERVICE_ESCROW_ABI;
    if (type === 'lease') activeABI = LEASE_ESCROW_ABI;

    const { data: basePayer } = useReadContract({ address, abi: activeABI, functionName: type === 'service' ? 'buyer' : type === 'lease' ? 'lessee' : 'payer' });
    const { data: basePayee } = useReadContract({ address, abi: activeABI, functionName: type === 'service' ? 'provider' : type === 'lease' ? 'lessor' : 'payee' });
    const { data: arbiter } = useReadContract({ address, abi: activeABI, functionName: 'arbiter' });
    const { data: token } = useReadContract({ address, abi: activeABI, functionName: 'token' });
    const { data: config } = useReadContract({ address, abi: activeABI, functionName: 'config' });
    const { data: arbitrationAdapter } = useReadContract({ address, abi: activeABI, functionName: 'arbitrationAdapter' });

    const details: EscrowDetails | undefined = (basePayer && basePayee) ? {
        payer: basePayer as Address, // We map buyer/lessee -> payer conceptually for the UI wrapper
        payee: basePayee as Address, // We map provider/lessor -> payee conceptually for the UI wrapper
        arbiter: arbiter as Address,
        token: token as Address,
        arbitrationAdapter: arbitrationAdapter as Address,
        config
    } : undefined;

    return {
        type,
        milestones,
        rentalDetails,
        serviceDetails,
        leaseDetails,
        details,
        isLoading: !type || type === 'loading' || !details,
        isError: false,
        statusLabels: MILESTONE_STATUS,
        refetch: () => {
            refetchMilestones();
            refetchRental1();
            refetchRental2();
            refetchService1();
            refetchService2();
            refetchLease1();
            refetchLease2();
        }
    };
}
