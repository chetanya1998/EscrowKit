import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { Transaction, UsageStats } from '@/lib/mock-data';
import { authFetch, API_BASE_URL, getStoredAuthToken, shortenAddress } from '@/lib/utils';
import { getTokenByAddress, ZERO_ADDRESS } from '@/lib/tokens';
import { formatUnits } from 'viem';

const EMPTY_STATS: UsageStats = {
    totalVolume: '0',
    activeEscrows: 0,
    completedEscrows: 0,
    disputeRate: '0%',
    activeDisputes: 0,
};

type ApiEscrow = {
    id: string;
    address: string;
    payer: string;
    payee: string;
    createdAt: string;
    tokenAddress?: string | null;
    milestones: Array<{
        amount: string;
        description?: string | null;
        status: string;
    }>;
    disputes?: Array<{
        status: string;
    }>;
};

async function fetchStats(address: string): Promise<UsageStats> {
    if (!getStoredAuthToken()) {
        return EMPTY_STATS;
    }

    const res = await authFetch(`${API_BASE_URL}/users/${address}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

async function fetchEscrows(address: string, role?: string): Promise<Transaction[]> {
    if (!getStoredAuthToken()) {
        return [];
    }

    const url = new URL(`${API_BASE_URL}/users/${address}/escrows`);
    if (role) url.searchParams.append('role', role);

    const res = await authFetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch escrows');
    const data = await res.json() as ApiEscrow[];

    return data.map((escrow: any) => ({
        id: escrow.id,
        address: escrow.address,
        date: new Date(escrow.createdAt).toISOString().split('T')[0],
        type: escrow.payer.toLowerCase() === address.toLowerCase() ? 'created' : 'funded',
        description: escrow.milestones[0]?.description || `Escrow ${shortenAddress(escrow.address)}`,
        amount: formatEscrowAmount(escrow),
        currency: getEscrowCurrency(escrow),
        counterparty: escrow.payer.toLowerCase() === address.toLowerCase() ? escrow.payee : escrow.payer,
        status: getEscrowStatus(escrow),
    }));
}

function getEscrowStatus(escrow: ApiEscrow): Transaction['status'] {
    if (escrow.disputes?.some((dispute) => dispute.status === 'OPEN') || escrow.milestones.some((milestone) => milestone.status === 'DISPUTED')) {
        return 'disputed';
    }

    if (escrow.milestones.length > 0 && escrow.milestones.every((milestone) => milestone.status === 'RELEASED' || milestone.status === 'REFUNDED')) {
        return 'completed';
    }

    return 'pending';
}

function getEscrowCurrency(escrow: ApiEscrow): string {
    const tokenAddress = escrow.tokenAddress ?? ZERO_ADDRESS;
    return getTokenByAddress(tokenAddress)?.symbol ?? (tokenAddress === ZERO_ADDRESS ? 'ETH' : 'TOKEN');
}

function formatEscrowAmount(escrow: ApiEscrow): string {
    const tokenAddress = escrow.tokenAddress ?? ZERO_ADDRESS;
    const decimals = getTokenByAddress(tokenAddress)?.decimals ?? 18;
    const totalAmount = escrow.milestones.reduce((sum, milestone) => sum + BigInt(milestone.amount ?? '0'), 0n);
    return formatUnits(totalAmount, decimals);
}

export function useDashboardData(role?: 'payer' | 'payee' | 'admin') {
    const { address } = useAccount();
    const targetAddress = address;

    const statsQuery = useQuery({
        queryKey: ['dashboard-stats', targetAddress, role],
        queryFn: () => fetchStats(targetAddress!),
        enabled: !!targetAddress,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
    });

    const transactionsQuery = useQuery({
        queryKey: ['dashboard-transactions', targetAddress, role],
        queryFn: () => fetchEscrows(targetAddress!, role),
        enabled: !!targetAddress,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    });

    return {
        stats: statsQuery.data ?? EMPTY_STATS,
        transactions: transactionsQuery.data ?? [],
        isLoading: statsQuery.isLoading || transactionsQuery.isLoading,
        isFetching: statsQuery.isFetching || transactionsQuery.isFetching,
        error: statsQuery.error || transactionsQuery.error,
        isStale: statsQuery.isStale || transactionsQuery.isStale,
        address: targetAddress ?? null,
    };
}
