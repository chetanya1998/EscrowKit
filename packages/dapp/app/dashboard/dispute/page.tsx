"use client"

import { useDashboardData } from "@/hooks/useDashboardData"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Scale, Lock, Clock, Send, FileText, CheckCircle2, ShieldAlert, AlertTriangle, Check, X } from "lucide-react"
import Link from "next/link"
import React, { useState, Suspense } from "react"

function DisputeContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id') as string

    // Fetch dispute details from mock data using ID
    const { transactions, address } = useDashboardData()
    // Find the specific transaction, or mock one if navigating manually
    const caseData = transactions?.find((tx: any) => tx.id === id) || {
        id: id,
        date: "2023-11-02",
        amount: "50",
        currency: "USDC",
        counterparty: "0x456...def",
        status: "disputed",
        description: "Frontend Development Services"
    }

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [evidence, setEvidence] = useState("")

    // Mock Evidence Timeline
    const timeline = [
        {
            id: 1,
            role: "Payer",
            address: "0x123...abc",
            message: "The freelancer stopped responding after submitting the first draft. The draft was incomplete.",
            timestamp: "2 days ago",
            isCurrentUser: true,
        },
        {
            id: 2,
            role: "Payee",
            address: caseData?.counterparty || "0x456...def",
            message: "I submitted the draft exactly as requested in the specifications. Waiting for feedback.",
            timestamp: "1 day ago",
            isCurrentUser: false,
        },
        {
            id: 3,
            role: "Arbiter",
            address: "EscrowKit DAO",
            message: "Reviewing the submitted evidence. Please provide the original Figma files for comparison.",
            timestamp: "5 hours ago",
            isCurrentUser: false,
            isSystem: true
        }
    ]

    const handleSubmitEvidence = (e: React.FormEvent) => {
        e.preventDefault()
        if (!evidence.trim()) return
        setIsSubmitting(true)
        // Mock submission
        setTimeout(() => {
            setIsSubmitting(false)
            setEvidence("")
        }, 800)
    }

    if (!caseData) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center text-neutral-500 gap-4">
                <ShieldAlert className="h-12 w-12 text-neutral-600" />
                <p>Case not found or loading...</p>
                <Link href="/dashboard/disputes">
                    <Button variant="outline">Return to Resolution Center</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mt-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/dashboard/disputes" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
                            ← Back to Disputes
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-50 mb-2 flex items-center gap-3">
                        Case #{id}
                        <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 text-sm">
                            Active Dispute
                        </Badge>
                    </h1>
                    <p className="text-neutral-400 max-w-2xl">
                        This contract is currently locked in arbitration. Both parties should submit relevant evidence below.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href={`/escrow?address=${caseData.id}`}>
                        <Button variant="outline" className="border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 gap-2 font-medium">
                            <FileText className="h-4 w-4" />
                            View Original Contract
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Evidence Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden flex flex-col h-[700px]">
                        <CardHeader className="border-b border-neutral-800/50 pb-4 shrink-0 bg-neutral-900 z-10">
                            <CardTitle className="text-lg font-medium text-neutral-200 flex items-center gap-2">
                                <Scale className="h-5 w-5 text-amber-500" />
                                Evidence & Communication
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {timeline.map((item) => (
                                <div key={item.id} className={`flex flex-col ${item.isCurrentUser ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-center gap-2 mb-1.5 ${item.isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${item.isSystem ? 'bg-amber-500/10 text-amber-500'
                                            : item.role === 'Payer' ? 'bg-blue-500/10 text-blue-400'
                                                : 'bg-emerald-500/10 text-emerald-400'
                                            }`}>
                                            {item.role}
                                        </span>
                                        <span className="text-[10px] text-neutral-500 font-mono">{item.address}</span>
                                        <span className="text-[10px] text-neutral-600">{item.timestamp}</span>
                                    </div>
                                    <div className={`p-4 max-w-[85%] text-sm leading-relaxed shadow-sm ${item.isSystem
                                        ? 'bg-neutral-950 border border-amber-500/20 text-neutral-300 rounded-2xl rounded-tl-sm'
                                        : item.isCurrentUser
                                            ? 'bg-neutral-800 border-l-2 border-l-emerald-500 text-neutral-200 rounded-2xl rounded-tr-sm'
                                            : 'bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-2xl rounded-tl-sm'
                                        }`}>
                                        {item.message}
                                    </div>
                                </div>
                            ))}
                        </CardContent>

                        <div className="p-4 border-t border-neutral-800 bg-neutral-950 shrink-0">
                            <form onSubmit={handleSubmitEvidence} className="flex flex-col gap-3">
                                <Textarea
                                    placeholder="Provide detailed evidence, links to deliverables, or context..."
                                    className="bg-neutral-900 border-neutral-800 min-h-[80px] resize-none focus-visible:ring-emerald-500/50"
                                    value={evidence}
                                    onChange={(e) => setEvidence(e.target.value)}
                                />
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                                        <Lock className="h-3 w-3" /> Securely recorded for Arbiter review
                                    </p>
                                    <Button
                                        type="submit"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
                                        disabled={isSubmitting || !evidence.trim()}
                                    >
                                        <Send className="h-4 w-4" />
                                        {isSubmitting ? "Submitting..." : "Submit Evidence"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Case Summary & Arbitration Actions */}
                <div className="space-y-6">
                    <Card className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden">
                        <div className="h-1 w-full bg-neutral-800"></div>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                                Case Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex items-center gap-2 text-neutral-50 mb-1">
                                    <Lock className="h-5 w-5 text-amber-500" />
                                    <span className="font-bold text-3xl tracking-tight">{caseData.amount} {caseData.currency}</span>
                                </div>
                                <p className="text-xs text-neutral-500 font-medium">Total Contested Value Locked</p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-neutral-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-400">Escrow Type</span>
                                    <span className="text-sm font-medium text-neutral-200 capitalize">{caseData.description || 'Milestone'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-400">Dispute Opened</span>
                                    <span className="text-sm font-medium text-neutral-200">{caseData.date}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-400">Assigned Arbiter</span>
                                    <span className="text-sm font-medium text-amber-500">EscrowKit DAO</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-neutral-200">
                                Settlement Offer
                            </CardTitle>
                            <CardDescription className="text-neutral-400 text-sm leading-relaxed">
                                Propose a new split of the contested funds. If accepted, the dispute resolves instantly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-neutral-300">Amount to send to Counterparty</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder={`Max: ${caseData.amount}`}
                                        className="bg-neutral-950 border-neutral-800 pl-4 pr-16 focus-visible:ring-emerald-500 font-mono text-neutral-200 h-11"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <span className="text-sm text-neutral-500 font-medium">{caseData.currency}</span>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full bg-neutral-100 text-neutral-900 hover:bg-neutral-300 gap-2 font-semibold h-11">
                                <CheckCircle2 className="h-4 w-4" />
                                Propose Resolution
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Arbiter Admin Panel (Mock view for demo purposes) */}
                    <Card className="border-red-900/30 bg-red-950/10 shadow-xl overflow-hidden mt-6">
                        <div className="h-1 w-full bg-red-500/50"></div>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-red-500 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Arbiter Execution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-5">
                            <Button variant="outline" className="w-full justify-start border-emerald-900/50 hover:bg-emerald-900/20 text-emerald-500 bg-emerald-950/30">
                                <Check className="h-4 w-4 mr-2" /> Release to Payee
                            </Button>
                            <Button variant="outline" className="w-full justify-start border-red-900/50 hover:bg-red-900/20 text-red-500 bg-red-950/30">
                                <X className="h-4 w-4 mr-2" /> Refund to Payer
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default function DisputeCasePage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-12">Loading Dispute Timeline...</div>}>
            <DisputeContent />
        </Suspense>
    )
}
