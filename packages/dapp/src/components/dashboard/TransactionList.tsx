import { ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePlatform } from '@/contexts/PlatformContext';
import { useDeveloperEscrows } from '@/hooks/useDeveloperPlatform';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { getTokenByAddress, ZERO_ADDRESS } from '@/lib/tokens';
import type { Escrow } from '@/lib/developer-platform';
import { shortenAddress } from '@/lib/utils';
import Link from 'next/link';

interface TransactionListProps {
    className?: string;
    limit?: number;
}

function getEscrowStatus(escrow: Escrow) {
    if (escrow.disputes?.some((dispute) => dispute.status === 'OPEN') || escrow.milestones?.some((milestone) => milestone.status === 'DISPUTED')) {
        return 'disputed';
    }
    if (escrow.milestones && escrow.milestones.length > 0 && escrow.milestones.every((milestone) => milestone.status === 'RELEASED' || milestone.status === 'REFUNDED')) {
        return 'completed';
    }
    return 'pending';
}

function getEscrowCurrency(escrow: Escrow): string {
    const tokenAddress = escrow.tokenAddress ?? ZERO_ADDRESS;
    return getTokenByAddress(tokenAddress)?.symbol ?? (tokenAddress === ZERO_ADDRESS ? 'ETH' : 'TOKEN');
}

function formatEscrowAmount(escrow: Escrow): string {
    const tokenAddress = escrow.tokenAddress ?? ZERO_ADDRESS;
    const decimals = getTokenByAddress(tokenAddress)?.decimals ?? 18;
    const totalAmount = escrow.milestones?.reduce((sum, milestone) => sum + BigInt(milestone.amount ?? '0'), 0n) ?? 0n;
    return formatUnits(totalAmount, decimals);
}

export function TransactionList({ className, limit }: TransactionListProps) {
    const { selectedProjectId, selectedEnvironmentId, isAuthenticated } = usePlatform();
    const { address } = useAccount();

    const { data: escrows, isLoading, error } = useDeveloperEscrows(
        { projectId: selectedProjectId, environmentId: selectedEnvironmentId },
        !!selectedProjectId && isAuthenticated
    );

    const displayEscrows = limit && escrows ? escrows.slice(0, limit) : escrows;

    return (
        <div className={twMerge('w-full border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900', className)}>
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Project Escrows</h3>
            </div>
            
            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                </div>
            )}

            {error && (
                <div className="px-6 py-8 text-center text-red-500 bg-red-500/5">
                    Failed to load escrows. Please ensure you have access to this environment.
                </div>
            )}

            {!isLoading && !error && (!displayEscrows || displayEscrows.length === 0) && (
                <div className="px-6 py-12 text-center text-zinc-500">
                    No escrows found for this environment.
                </div>
            )}

            {!isLoading && !error && displayEscrows && displayEscrows.length > 0 && (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {displayEscrows.map((escrow) => {
                        const status = getEscrowStatus(escrow);
                        const isPayer = address && escrow.payer.toLowerCase() === address.toLowerCase();
                        const type = isPayer ? 'created' : 'funded';
                        const currency = getEscrowCurrency(escrow);
                        const amount = formatEscrowAmount(escrow);
                        const description = escrow.milestones?.[0]?.description || `Escrow ${shortenAddress(escrow.address)}`;
                        const date = new Date(escrow.createdAt).toLocaleDateString();

                        return (
                            <Link href={`/escrows/${escrow.id}`} key={escrow.id} className="block">
                                <div className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            'p-2 rounded-full',
                                            type === 'created' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                                            type === 'funded' && 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                                        )}>
                                            {type === 'created' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">{description}</p>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{date}</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                            {amount} {currency}
                                        </p>
                                        <div className="flex items-center justify-end gap-1.5 mt-1">
                                            <span className={clsx(
                                                'w-2 h-2 rounded-full',
                                                status === 'completed' && 'bg-green-500',
                                                status === 'pending' && 'bg-amber-500',
                                                status === 'disputed' && 'bg-red-500',
                                            )} />
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{status}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
