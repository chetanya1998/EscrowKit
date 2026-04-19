"use client"

import React from 'react'
import { Terminal, Copy, Check, Info } from 'lucide-react'

export default function SdkDocsPage() {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const codeBlocks = [
    {
      title: "Installation",
      code: "pnpm add @escrowkit/sdk-ts viem",
      lang: "bash"
    },
    {
      title: "Initializing the Client",
      code: `import { createEscrowClient } from '@escrowkit/sdk-ts'
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum)
})

const client = createEscrowClient({
  walletClient,
  apiKey: 'your_api_key_here'
})`,
      lang: "typescript"
    },
    {
      title: "Creating a Milestone Escrow",
      code: `const escrow = await client.milestone.create({
  payee: '0x...',
  milestones: [
    { amount: '1.5', description: 'Design Phase' },
    { amount: '2.5', description: 'Development Phase' }
  ]
})

console.log('Escrow created at:', escrow.address)`,
      lang: "typescript"
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-10 px-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm uppercase tracking-widest">
          <Terminal className="w-4 h-4" /> SDK Reference
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">@escrowkit/sdk-ts</h1>
        <p className="text-lg text-neutral-400 max-w-2xl">
          A powerful, type-safe TypeScript SDK for building on top of the EscrowKit protocol. Compatible with all EVM chains.
        </p>
      </div>

      <div className="space-y-12">
        {codeBlocks.map((block, i) => (
          <div key={i} className="space-y-4">
            <h3 className="text-xl font-bold text-neutral-200">{block.title}</h3>
            <div className="relative group">
              <pre className="bg-neutral-900 border border-white/10 rounded-xl p-6 overflow-x-auto font-mono text-sm text-neutral-300">
                <code>{block.code}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(block.code, i)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
              >
                {copiedIndex === i ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-neutral-400" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex gap-4">
        <Info className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
        <div className="space-y-2 text-sm">
          <div className="font-bold text-neutral-200">Prerequisites</div>
          <p className="text-neutral-400 leading-relaxed">
            The SDK requires <code className="text-neutral-200">viem</code> as a peer dependency. Make sure you have a valid provider (like MetaMask or an RPC URL) configured before initializing the client.
          </p>
        </div>
      </div>
    </div>
  )
}
