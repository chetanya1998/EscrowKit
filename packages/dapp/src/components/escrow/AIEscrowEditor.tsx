"use client";

import { IntegrationCodeViewer } from "./IntegrationCodeViewer";

interface MilestoneConfig {
    description: string;
    percentage: number;
    amountOriginal: number;
    amountCrypto: number;
}

export interface AiEscrowConfig {
    title: string;
    description: string;
    originalCurrency: string;
    targetTokenCurrency: string;
    exchangeRateApplied: number;
    totalAmountOriginal: number;
    totalAmountCrypto: number;
    milestones: MilestoneConfig[];
}

export function AIEscrowEditor({ config }: { config: AiEscrowConfig }) {
    if (!config) return null;

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Summary Card */}
            <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="text-6xl font-black">{config.targetTokenCurrency}</span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">{config.title}</h2>
                <p className="text-zinc-400 mb-6 max-w-2xl">{config.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-800/50">
                    <div>
                        <div className="text-sm text-zinc-500 mb-1">Requested Amount</div>
                        <div className="text-xl font-semibold text-zinc-200">
                            {config.totalAmountOriginal.toLocaleString()} <span className="text-sm text-zinc-500">{config.originalCurrency}</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-zinc-500 mb-1">Exchange Rate Applied</div>
                        <div className="text-xl font-semibold text-emerald-400">
                            {config.exchangeRateApplied === 1.0 ? "1:1" : `1 ${config.originalCurrency} = ${config.exchangeRateApplied} ${config.targetTokenCurrency}`}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-emerald-500 font-medium mb-1">Total Crypto to Lock</div>
                        <div className="text-2xl font-bold text-white">
                            {config.totalAmountCrypto.toLocaleString()} <span className="text-sm text-emerald-500">{config.targetTokenCurrency}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Milestones Breakdown */}
            <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-bold">M</span>
                    Milestone Breakdown
                </h3>

                <div className="space-y-3">
                    {config.milestones?.map((milestone, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-black border border-zinc-800 flex items-center justify-center font-mono text-zinc-500">
                                    {idx + 1}
                                </div>
                                <div>
                                    <div className="font-medium text-white">{milestone.description}</div>
                                    <div className="text-sm text-zinc-500">{milestone.percentage}% of total</div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="font-bold text-emerald-400">{milestone.amountCrypto.toLocaleString()} {config.targetTokenCurrency}</div>
                                <div className="text-xs text-zinc-500">~{milestone.amountOriginal.toLocaleString()} {config.originalCurrency}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <IntegrationCodeViewer config={config} />
        </div>
    );
}
