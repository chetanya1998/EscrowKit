"use client"

import React from 'react'
import { BookOpen, Terminal, Code2, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

export default function DocsOverviewPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-10 px-6">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-white">Developer Documentation</h1>
        <p className="text-lg text-neutral-400 max-w-2xl">
          Everything you need to integrate EscrowKit's trustless payment infrastructure into your own platforms and workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/docs/sdk" className="group p-6 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-emerald-500/50 transition-all">
          <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4 group-hover:bg-emerald-500/20 transition-colors">
            <Terminal className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">SDK Reference</h3>
          <p className="text-neutral-400 text-sm mb-4">
            Build on-chain integrations using our lightweight TypeScript SDK. Supports Milestone, Service, and Rental escrows.
          </p>
          <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
            Explore SDK <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/dashboard/docs/api" className="group p-6 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-emerald-500/50 transition-all">
          <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-4 group-hover:bg-blue-500/20 transition-colors">
            <Code2 className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">API Reference</h3>
          <p className="text-neutral-400 text-sm mb-4">
            Directly interact with our REST API for wallet management, transaction helpers, and real-time read models.
          </p>
          <div className="flex items-center gap-2 text-blue-500 text-sm font-bold">
            View API Docs <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
          Why build with EscrowKit?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <div className="font-bold text-neutral-200">Non-Custodial</div>
            <p className="text-neutral-400">EscrowKit never holds user funds. Everything is governed by immutable smart contracts on-chain.</p>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-neutral-200">Real-time Sync</div>
            <p className="text-neutral-400">Our indexer ensures your database stays in sync with on-chain events via signed webhooks.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
