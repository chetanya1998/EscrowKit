"use client"

import React from "react"
import { Token, getTokenGroups, SUPPORTED_TOKENS, ZERO_ADDRESS } from "@/lib/tokens"

interface TokenSelectorProps {
    value: string; // token address
    onChange: (token: Token) => void;
    label?: string;
    showFiat?: boolean;
    className?: string;
}

export function TokenSelector({ value, onChange, label = "Currency", showFiat = true, className }: TokenSelectorProps) {
    const groups = getTokenGroups();
    const selected = SUPPORTED_TOKENS.find(
        (t) => t.address.toLowerCase() === value.toLowerCase() && !t.isFiat
    ) || SUPPORTED_TOKENS.find(
        (t) => t.address.toLowerCase() === value.toLowerCase()
    ) || SUPPORTED_TOKENS[0];

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => {
                        const token = SUPPORTED_TOKENS.find((t) => t.address === e.target.value) || SUPPORTED_TOKENS[0];
                        onChange(token);
                    }}
                    className="w-full h-11 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 px-3 pr-10 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors cursor-pointer"
                >
                    {groups.map((group) => {
                        if (!showFiat && group.label.includes("Fiat")) return null;
                        if (group.tokens.length === 0) return null;
                        return (
                            <optgroup key={group.label} label={group.label}>
                                {group.tokens.map((token) => (
                                    <option key={`${token.symbol}-${token.isFiat}`} value={token.address}>
                                        {token.logo} {token.symbol} — {token.name}
                                    </option>
                                ))}
                            </optgroup>
                        );
                    })}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>

            {/* Info bar */}
            <div className="mt-2 flex items-center gap-2">
                <span className="text-lg">{selected.logo}</span>
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-neutral-300">{selected.symbol}</span>
                    {selected.isFiat && (
                        <span className="text-[10px] text-amber-400">
                            Backed by {selected.fiatMapsTo} stablecoin
                        </span>
                    )}
                    {!selected.isFiat && selected.address !== ZERO_ADDRESS && (
                        <span className="text-[10px] text-neutral-600 font-mono">
                            {selected.address.slice(0, 6)}...{selected.address.slice(-4)}
                        </span>
                    )}
                    {selected.address === ZERO_ADDRESS && (
                        <span className="text-[10px] text-neutral-600">Native gas token</span>
                    )}
                </div>
            </div>
        </div>
    );
}
