"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Terminal, 
  Code2, 
  Key, 
  Webhook, 
  Activity, 
  Copy, 
  Plus, 
  Settings, 
  FileCode, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react"
import Link from 'next/link'

export default function DeveloperPlatform() {
  const [apiKey, setApiKey] = useState('ek_live_8be7a3...c0ffee')
  const [showKey, setShowKey] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Add toast or notification here if available
  }

  return (
    <div className="flex flex-col gap-10 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Platform Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Developer Platform</h1>
            <p className="text-neutral-500 text-sm">Manage your API integrations and webhooks</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: API & Keys */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* API Keys Card */}
          <Card className="bg-neutral-900 border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/[0.01] px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Key className="h-4 w-4 text-indigo-400" />
                    API Keys
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-500 mt-1">
                    Used to authenticate requests to our REST API and SDK.
                  </CardDescription>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full h-9 px-4 text-xs font-bold gap-2">
                  <Plus className="h-3.5 w-3.5" /> Create Key
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">PROD SECRET KEY</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-12 bg-neutral-950 border border-white/10 rounded-xl px-4 flex items-center justify-between group">
                      <code className="text-sm font-mono text-neutral-300">
                        {showKey ? 'ek_live_8be7a3_d41d8cd98f00b204e9800998ecf8427e' : apiKey}
                      </code>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-neutral-500 hover:text-white"
                          onClick={() => setShowKey(!showKey)}
                        >
                          {showKey ? 'Hide' : 'Reveal'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-neutral-500 hover:text-white"
                          onClick={() => copyToClipboard('ek_live_8be7a3_...')}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs text-neutral-500 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Created 2 days ago</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Active</span>
                  </div>
                  <Button variant="link" className="text-indigo-400 hover:text-indigo-300 h-auto p-0 text-xs">Roll key</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhooks Card */}
          <Card className="bg-neutral-900 border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/[0.01] px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-purple-400" />
                    Webhooks
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-500 mt-1">
                    Receive real-time notifications when escrow states change.
                  </CardDescription>
                </div>
                <Button variant="outline" className="border-white/10 hover:bg-white/5 text-neutral-300 rounded-full h-9 px-4 text-xs font-bold gap-2">
                   Add Endpoint
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4 border-2 border-dashed border-white/5 rounded-2xl">
                <div className="h-12 w-12 rounded-full bg-neutral-950 flex items-center justify-center text-neutral-600">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="max-w-[240px]">
                  <p className="text-sm font-bold text-neutral-300">No endpoints configured</p>
                  <p className="text-xs text-neutral-500 mt-1">Add a URL to begin receiving webhook events from the protocol.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Docs & Quick Links */}
        <div className="space-y-8">
          
          {/* Service Status */}
          <Card className="bg-neutral-900 border-white/5 rounded-2xl shadow-xl p-8">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">System Health</h3>
            <div className="space-y-6">
              <StatusRow label="REST API" status="Operational" />
              <StatusRow label="Event Indexer" status="Operational" />
              <StatusRow label="Smart Engine" status="Operational" />
            </div>
            <Button variant="ghost" className="w-full mt-8 border-t border-white/5 pt-6 text-xs text-neutral-500 hover:text-white rounded-none h-auto">
              View Detailed Status <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </Card>

          {/* Quick Docs */}
          <Card className="bg-gradient-to-br from-indigo-900/40 to-neutral-950 border-white/10 rounded-2xl shadow-xl p-8 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Code2 className="h-40 w-40" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-4">Integrate in minutes</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              EscrowKit provides a powerful SDK for React, Node, and Go. Secure your marketplace payments with just a few lines of code.
            </p>
            
            <div className="space-y-2">
              <DocLink title="Go to Docs" href="/dashboard/docs" primary />
              <DocLink title="SDK Guides" href="/dashboard/docs/sdk" />
              <DocLink title="API Spec" href="/dashboard/docs/api" />
            </div>
          </Card>

          {/* New Feature Badge */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 relative group cursor-help">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-emerald-400">Audited Contracts</span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-2">All EscrowKit core contracts have been audited by SigmaPrime. View report <ChevronRight className="inline h-2 w-2" /></p>
          </div>

        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-neutral-300">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
        <span className="text-xs text-neutral-500">{status}</span>
      </div>
    </div>
  )
}

function DocLink({ title, href, primary = false }: { title: string, href: string, primary?: boolean }) {
  return (
    <Link href={href}>
      <div className={`flex items-center justify-between p-3 rounded-xl transition-all ${primary ? 'bg-white/10 text-white hover:bg-white/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}>
        <span className="text-sm font-bold">{title}</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </Link>
  )
}
