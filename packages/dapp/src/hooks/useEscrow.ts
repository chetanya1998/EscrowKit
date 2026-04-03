import { useQuery } from '@tanstack/react-query';
import { useReadContract, useReadContracts } from 'wagmi';
import {
    B2B_VENDOR_ESCROW_ABI,
    FACTORY_ABI,
    FACTORY_V1_ABI,
    FACTORY_ADDRESS,
    LEASE_ESCROW_ABI,
    LEGACY_FACTORY_ADDRESSES,
    LEGACY_MILESTONE_ESCROW_ABI,
    MILESTONE_ESCROW_ABI,
    RENTAL_ESCROW_ABI,
    SERVICE_ESCROW_ABI
} from '@/lib/constants';
import { Address } from 'viem';
import { usePublicClient } from 'wagmi';

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

export interface B2BVendorDetails {
    depositAmount: bigint;
    status: number; // 0=PENDING, 1=FUNDED, 2=SUBMITTED, 3=APPROVED, 4=RELEASED, 5=REFUNDED, 6=DISPUTED
    submittedAt: bigint;
    invoiceURI: string;
    invoiceHash: string;
}

const MILESTONE_STATUS = [
    'PENDING',
    'SUBMITTED',
    'APPROVED',
    'RELEASED',
    'REFUNDED',
    'DISPUTED'
] as const;

const CLONE_PREFIX = '363d3d373d3d3d363d73';
const CLONE_SUFFIX = '5af43d82803e903d91602b57fd5bf3';

function sameAddress(left?: string | null, right?: string | null): boolean {
    return !!left && !!right && left.toLowerCase() === right.toLowerCase();
}

function extractCloneImplementationAddress(bytecode?: `0x${string}` | null): Address | null {
    if (!bytecode) {
        return null;
    }

    const normalized = bytecode.slice(2).toLowerCase();
    if (!normalized.startsWith(CLONE_PREFIX) || !normalized.endsWith(CLONE_SUFFIX)) {
        return null;
    }

    const implementation = normalized.slice(CLONE_PREFIX.length, CLONE_PREFIX.length + 40);
    return (`0x${implementation}`) as Address;
}

export function useEscrow(address: Address | undefined) {
    const publicClient = usePublicClient();

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

    // 5. Try to fetch vendor (B2B Vendor Escrow)
    const { data: b2bVendorData } = useReadContract({
        address,
        abi: B2B_VENDOR_ESCROW_ABI,
        functionName: 'vendor',
    });

    // Heuristic Classification
    let type: 'milestone' | 'rental' | 'service' | 'lease' | 'b2b-vendor' | 'loading' = 'loading';
    if (b2bVendorData) {
        type = 'b2b-vendor';
    } else if (buyerData) {
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

    const protocolVersionQuery = useQuery({
        queryKey: ['escrow-protocol-version', address, type],
        enabled: !!address && type === 'milestone' && !!publicClient,
        queryFn: async (): Promise<1 | 2> => {
            const [bytecode, primaryImplementation, legacyImplementations] = await Promise.all([
                publicClient!.getBytecode({ address: address! }),
                publicClient!.readContract({
                    address: FACTORY_ADDRESS,
                    abi: FACTORY_ABI,
                    functionName: 'implementation',
                }).catch(() => null),
                Promise.all(
                    LEGACY_FACTORY_ADDRESSES.map((factoryAddress: Address) =>
                        publicClient!.readContract({
                            address: factoryAddress,
                            abi: FACTORY_V1_ABI,
                            functionName: 'implementation',
                        }).catch(() => null)
                    )
                ),
            ]);

            const cloneImplementation = extractCloneImplementationAddress(bytecode);

            if (cloneImplementation && sameAddress(cloneImplementation, primaryImplementation as string | null)) {
                return 2;
            }

            if (cloneImplementation && legacyImplementations.some((implementation: unknown) => sameAddress(cloneImplementation, implementation as string | null))) {
                return 1;
            }

            if (cloneImplementation && primaryImplementation && !sameAddress(cloneImplementation, primaryImplementation as string | null)) {
                return 1;
            }

            return 2;
        },
    });

    const protocolVersion = type === 'milestone' ? (protocolVersionQuery.data ?? null) : null;
    const milestoneAbi = protocolVersion === 1 ? LEGACY_MILESTONE_ESCROW_ABI : MILESTONE_ESCROW_ABI;

    // --- MILESTONE ESCROW LOGIC ---
    const count = type === 'milestone' && countData ? Number(countData) : 0;
    const milestoneContracts = Array.from({ length: count }, (_, i) => ({
        address,
        abi: milestoneAbi,
        functionName: 'milestones',
        args: [BigInt(i)]
    }));

    const { data: milestonesData, refetch: refetchMilestones } = useReadContracts({
        contracts: milestoneContracts,
        query: { enabled: type === 'milestone' && protocolVersion !== null }
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

    // --- B2B VENDOR ESCROW LOGIC ---
    const { data: b2bDeposit, refetch: refetchB2b1 } = useReadContract({
        address, abi: B2B_VENDOR_ESCROW_ABI, functionName: 'depositAmount', query: { enabled: type === 'b2b-vendor' }
    });
    const { data: b2bStatus, refetch: refetchB2b2 } = useReadContract({
        address, abi: B2B_VENDOR_ESCROW_ABI, functionName: 'status', query: { enabled: type === 'b2b-vendor' }
    });
    const { data: b2bSubmittedAt } = useReadContract({
        address, abi: B2B_VENDOR_ESCROW_ABI, functionName: 'submittedAt', query: { enabled: type === 'b2b-vendor' }
    });
    const { data: b2bInvoiceURI } = useReadContract({
        address, abi: B2B_VENDOR_ESCROW_ABI, functionName: 'invoiceURI', query: { enabled: type === 'b2b-vendor' }
    });
    const { data: b2bInvoiceHash } = useReadContract({
        address, abi: B2B_VENDOR_ESCROW_ABI, functionName: 'invoiceHash', query: { enabled: type === 'b2b-vendor' }
    });

    const b2bVendorDetails: B2BVendorDetails | undefined = type === 'b2b-vendor' && b2bDeposit !== undefined ? {
        depositAmount: b2bDeposit as bigint,
        status: Number(b2bStatus || 0),
        submittedAt: (b2bSubmittedAt as bigint) || 0n,
        invoiceURI: (b2bInvoiceURI as string) || "",
        invoiceHash: (b2bInvoiceHash as string) || "",
    } : undefined;


    // --- SHARED DETAILS (Generic Mapping) ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let activeABI: any = milestoneAbi;
    if (type === 'rental') activeABI = RENTAL_ESCROW_ABI;
    if (type === 'service') activeABI = SERVICE_ESCROW_ABI;
    if (type === 'lease') activeABI = LEASE_ESCROW_ABI;
    if (type === 'b2b-vendor') activeABI = B2B_VENDOR_ESCROW_ABI;

    const { data: basePayer } = useReadContract({ address, abi: activeABI, functionName: type === 'service' ? 'buyer' : type === 'lease' ? 'lessee' : type === 'b2b-vendor' ? 'buyer' : 'payer' });
    const { data: basePayee } = useReadContract({ address, abi: activeABI, functionName: type === 'service' ? 'provider' : type === 'lease' ? 'lessor' : type === 'b2b-vendor' ? 'vendor' : 'payee' });
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
        b2bVendorDetails,
        details,
        protocolVersion,
        supportsLegacyMilestoneSetup: type === 'milestone' && protocolVersion === 1,
        isLoading: !type || type === 'loading' || !details || (type === 'milestone' && protocolVersion === null),
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
            refetchB2b1();
            refetchB2b2();
        }
    };
}
