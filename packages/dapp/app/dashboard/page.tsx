'use client';

import { TransactionList } from '@/components/dashboard/TransactionList';
import { UsageStatsCard } from '@/components/dashboard/UsageStats';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function DashboardPage() {
    const { stats, transactions, isLoading, error } = useDashboardData();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex items-center justify-center">
                <div className="text-zinc-500">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex items-center justify-center">
                <div className="text-red-500">Error loading data. Is the backend running?</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Overview of your escrow activity and transactions.
                        </p>
                    </div>
                    <div className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Live
                    </div>
                </div>

                {stats && <UsageStatsCard stats={stats} className="mb-8" />}

                {transactions && <TransactionList transactions={transactions} />}
            </main>
        </div>
    );
}
