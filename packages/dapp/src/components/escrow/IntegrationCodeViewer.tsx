"use client";

import { useState } from "react";
import { Copy, Code } from "lucide-react";

export function IntegrationCodeViewer({ config }: { config: any }) {
    const defaultCurrency = config?.targetTokenCurrency || "USDC";
    const totalCrypto = config?.totalAmountCrypto || 0;

    // Convert to minor units (e.g. 6 decimals for USDC, 18 for native/others depending on token)
    // To keep it simple in the snippet, we just show standard formatUnits/parseUnits approach
    const snippet = `
import { EscrowKit } from '@escrowkit/sdk';
import { parseUnits } from 'viem';

// Initialize the SDK
const kit = new EscrowKit({
  walletClient: myWalletClient,
  publicClient: myPublicClient
});

// Create Escrow with defined milestones
const createAiEscrow = async () => {
    // Escrow for: ${config?.title || "Project"}
    // Generated from ${config?.originalCurrency} -> ${totalCrypto} ${defaultCurrency}
    const hash = await kit.createMilestoneEscrow({
        token: "0xTOKEN_ADDRESS_HERE", // Address of ${defaultCurrency}
        buyer: "0xBUYER_ADDRESS_HERE",
        seller: "0xSELLER_ADDRESS_HERE",
        milestones: [
            ${(config?.milestones || []).map((m: any) => `parseUnits("${m.amountCrypto || 0}", 6) // ${m.description}`).join(',\n            ')}
        ]
    });
    
    console.log("Escrow Created: ", hash);
};
`.trim();

    const handleCopy = () => {
        navigator.clipboard.writeText(snippet);
        alert("Code copied to clipboard!");
    };

    return (
        <div className="mt-8 border border-zinc-800 rounded-lg p-6 bg-zinc-950/50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Code className="h-5 w-5 text-emerald-500" />
                    Developer Integration Snippet
                </h3>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-md transition-colors"
                >
                    <Copy className="h-4 w-4" />
                    Copy Code
                </button>
            </div>

            <p className="text-zinc-400 text-sm mb-4">
                Use this tailored SDK snippet to programmatically create this exact escrow configuration in your own application or backend.
            </p>

            <pre className="bg-black p-4 rounded-md overflow-x-auto text-sm text-emerald-400 border border-zinc-800">
                <code>{snippet}</code>
            </pre>
        </div>
    );
}
