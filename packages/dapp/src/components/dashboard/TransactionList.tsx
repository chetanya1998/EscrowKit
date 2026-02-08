import { Transaction } from '@/lib/mock-data';
import { ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TransactionListProps {
    transactions: Transaction[];
    className?: string;
}

export function TransactionList({ transactions, className }: TransactionListProps) {
    return (
        <div className={twMerge('w-full border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900', className)}>
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Recent Transactions</h3>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={clsx(
                                'p-2 rounded-full',
                                tx.type === 'created' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                                tx.type === 'funded' && 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                                tx.type === 'released' && 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
                                (tx.type === 'refunded' || tx.type === 'disputed') && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                            )}>
                                {tx.type === 'created' && <ArrowUpRight size={18} />}
                                {tx.type === 'funded' && <ArrowDownLeft size={18} />}
                                {tx.type === 'released' && <CheckCircle2 size={18} />}
                                {(tx.type === 'refunded' || tx.type === 'disputed') && <AlertCircle size={18} />}
                            </div>
                            <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">{tx.description || tx.type}</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{tx.date}</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {tx.amount} {tx.currency}
                            </p>
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                                <span className={clsx(
                                    'w-2 h-2 rounded-full',
                                    tx.status === 'completed' && 'bg-green-500',
                                    tx.status === 'pending' && 'bg-amber-500',
                                    tx.status === 'failed' && 'bg-red-500',
                                )} />
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{tx.status}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
