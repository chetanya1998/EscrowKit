import { UsageStats } from '@/lib/mock-data';
import { Activity, ShieldCheck, Wallet } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface UsageStatsProps {
    stats: UsageStats;
    className?: string;
}

export function UsageStatsCard({ stats, className }: UsageStatsProps) {
    return (
        <div className={twMerge('grid gap-4 md:grid-cols-3', className)}>
            <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <Wallet className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Volume</p>
                        <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stats.totalVolume}</h3>
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <Activity className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Escrows</p>
                        <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stats.activeEscrows}</h3>
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Completed</p>
                        <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stats.completedEscrows}</h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
