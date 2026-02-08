import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { API_BASE_URL } from '@/lib/utils';
import { Transaction, UsageStats } from '@/lib/mock-data';

async function fetchStats(address: string): Promise<UsageStats> {
    const res = await fetch(`${API_BASE_URL}/users/${address}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

async function fetchEscrows(address: string): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE_URL}/users/${address}/escrows`);
    if (!res.ok) throw new Error('Failed to fetch escrows');
    const data = await res.json();

    // Map backend data to frontend Transaction interface if needed
    // For now assuming direct mapping or we'll adjust types
    return data.map((escrow: any) => ({
        id: escrow.id,
        date: new Date(escrow.createdAt).toISOString().split('T')[0],
        type: escrow.payer.toLowerCase() === address.toLowerCase() ? 'created' : 'funded', // Simplified logic
        description: escrow.milestones[0]?.description,
        amount: escrow.milestones[0]?.amount || '0', // taking first milestone for now
        currency: 'ETH', // hardcoded for now
        counterparty: escrow.payer.toLowerCase() === address.toLowerCase() ? escrow.payee : escrow.payer,
        status: escrow.milestones[0]?.status === 'RELEASED' ? 'completed' : 'pending',
    }));
}

export function useDashboardData() {
    const { address } = useAccount();
    // For testing/demo purposes, fallback to the seeded address if no wallet connected
    const targetAddress = address || '0x1234567890123456789012345678901234567890';

    const statsQuery = useQuery({
        queryKey: ['dashboard-stats', targetAddress],
        queryFn: () => fetchStats(targetAddress),
        enabled: !!targetAddress,
    });

    const transactionsQuery = useQuery({
        queryKey: ['dashboard-transactions', targetAddress],
        queryFn: () => fetchEscrows(targetAddress),
        enabled: !!targetAddress,
    });

    return {
        stats: statsQuery.data,
        transactions: transactionsQuery.data,
        isLoading: statsQuery.isLoading || transactionsQuery.isLoading,
        error: statsQuery.error || transactionsQuery.error,
        address: targetAddress
    };
}
