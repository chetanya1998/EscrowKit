"use client"

import React from 'react'
import { Code2, Globe, Lock, ShieldCheck } from 'lucide-react'

export default function ApiDocsPage() {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/escrows',
      desc: 'List all escrows associated with the authenticated user or API key.',
      params: ['organizationId (optional)', 'projectId (optional)']
    },
    {
      method: 'POST',
      path: '/api/v1/escrows',
      desc: 'Prepare an escrow creation transaction. Returns calldata for the on-chain factory call.',
      params: ['payee', 'milestones', 'escrowType']
    },
    {
      method: 'GET',
      path: '/api/v1/users/profile',
      desc: 'Fetch user profile, including organizations and active projects.',
      params: []
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-10 px-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-widest">
          <Globe className="w-4 h-4" /> API Reference
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">REST API</h1>
        <p className="text-lg text-neutral-400 max-w-2xl">
          Integrate EscrowKit directly into your backend using our secure REST API. Authenticated via SIWE or permanent API keys.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">Authentication</h2>
        <div className="p-6 rounded-2xl bg-neutral-900 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
            <Lock className="w-4 h-4" /> Header Example
          </div>
          <pre className="font-mono text-sm text-neutral-400 bg-black/50 p-4 rounded-lg border border-white/5">
            Authorization: Bearer {'<your_jwt_or_api_key>'}
          </pre>
          <p className="text-sm text-neutral-400 leading-relaxed">
            All requests must include a Bearer token. Production keys can be generated in the <span className="text-neutral-200">Settings {'>'} API Keys</span> section.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-white">Endpoints</h2>
        {endpoints.map((ep, i) => (
          <div key={i} className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5 space-y-4 hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                ep.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {ep.method}
              </span>
              <code className="text-neutral-200 font-mono text-sm font-bold">{ep.path}</code>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">{ep.desc}</p>
            {ep.params.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Parameters</div>
                <div className="flex flex-wrap gap-2">
                  {ep.params.map(p => (
                    <code key={p} className="px-2 py-1 bg-white/5 rounded border border-white/5 text-[11px] text-neutral-300">
                      {p}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
