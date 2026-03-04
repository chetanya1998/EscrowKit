export type TransactionType = 'created' | 'funded' | 'released' | 'refunded' | 'disputed';

export interface Transaction {
    id: string;
    date: string;
    type: TransactionType;
    amount: string;
    currency: string;
    counterparty: string;
    description?: string;
    status: 'pending' | 'completed' | 'failed';
}

export interface UsageStats {
    totalVolume: string;
    activeEscrows: number;
    completedEscrows: number;
    disputeRate: string;
}

export const mockTransactions: Transaction[] = [
    {
        id: 'tx_1',
        date: '2023-10-25',
        type: 'created',
        amount: '0.15',
        currency: 'ETH',
        counterparty: '0x123...abc',
        status: 'completed',
    },
    {
        id: 'tx_2',
        date: '2023-10-26',
        type: 'funded',
        amount: '0.15',
        currency: 'ETH',
        counterparty: '0x123...abc',
        status: 'completed',
    },
    {
        id: 'tx_3',
        date: '2023-10-28',
        type: 'released',
        amount: '0.15',
        currency: 'ETH',
        counterparty: '0x123...abc',
        status: 'completed',
    },
    {
        id: 'tx_4',
        date: '2023-11-01',
        type: 'created',
        amount: '50',
        currency: 'USDC',
        counterparty: '0x456...def',
        status: 'pending',
    },
    {
        id: 'tx_5',
        date: '2023-11-02',
        type: 'disputed',
        amount: '50',
        currency: 'USDC',
        counterparty: '0x456...def',
        status: 'pending',
    },
];

const mockUsageStats: UsageStats = {
    totalVolume: '4.5 ETH',
    activeEscrows: 3,
    completedEscrows: 12,
    disputeRate: '2%',
};

export const getTransactions = async (): Promise<Transaction[]> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockTransactions;
};

export const getUsageStats = async (): Promise<UsageStats> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return mockUsageStats;
};
