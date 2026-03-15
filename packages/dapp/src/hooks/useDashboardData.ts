import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { API_BASE_URL } from '@/lib/utils';
import { Transaction, UsageStats, mockTransactions } from '@/lib/mock-data';

// Default fallback data shown when API is unreachable
const FALLBACK_STATS: UsageStats = {
    totalVolume: '14.50',
    activeEscrows: 5,
    completedEscrows: 32,
    disputeRate: '1.2%',
};

async function fetchStats(address: string): Promise<UsageStats> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const headers = token ? { Authorization: `Bearer ${token}` } as HeadersInit : undefined;
    const res = await fetch(`${API_BASE_URL}/users/${address}/stats`, { headers });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

async function fetchEscrows(address: string, role?: string): Promise<Transaction[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const headers = token ? { Authorization: `Bearer ${token}` } as HeadersInit : undefined;
    const url = new URL(`${API_BASE_URL}/users/${address}/escrows`);
    if (role) url.searchParams.append('role', role);

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw new Error('Failed to fetch escrows');
    const data = await res.json();

    return data.map((escrow: any) => ({
        id: escrow.id,
        address: escrow.address,
        date: new Date(escrow.createdAt).toISOString().split('T')[0],
        type: escrow.payer.toLowerCase() === address.toLowerCase() ? 'created' : 'funded',
        description: escrow.milestones[0]?.description,
        amount: escrow.milestones[0]?.amount || '0',
        currency: 'ETH',
        counterparty: escrow.payer.toLowerCase() === address.toLowerCase() ? escrow.payee : escrow.payer,
        status: escrow.milestones[0]?.status === 'RELEASED' ? 'completed' : 'pending',
    }));
}

export function useDashboardData(role?: 'payer' | 'payee' | 'admin') {
    const { address } = useAccount();
    const targetAddress = address || '0x1234567890123456789012345678901234567890';

    const statsQuery = useQuery({
        queryKey: ['dashboard-stats', targetAddress, role],
        queryFn: () => fetchStats(targetAddress),
        enabled: !!targetAddress,
        staleTime: 5 * 60 * 1000,      // Data stays fresh for 5 minutes
        gcTime: 30 * 60 * 1000,         // Cache persists for 30 minutes
        retry: 2,                        // Retry twice on failure
        placeholderData: FALLBACK_STATS, // Show zeros instead of nothing
    });

    const transactionsQuery = useQuery({
        queryKey: ['dashboard-transactions', targetAddress, role],
        queryFn: () => fetchEscrows(targetAddress, role),
        enabled: !!targetAddress,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        placeholderData: mockTransactions,             // Show realistic mock data instead of empty array
    });

    return {
        stats: statsQuery.data ?? FALLBACK_STATS,
        transactions: transactionsQuery.data ?? mockTransactions,
        isLoading: statsQuery.isLoading || transactionsQuery.isLoading,
        isFetching: statsQuery.isFetching || transactionsQuery.isFetching,
        error: statsQuery.error || transactionsQuery.error,
        isStale: statsQuery.isStale || transactionsQuery.isStale,
        address: targetAddress,
    };
}
