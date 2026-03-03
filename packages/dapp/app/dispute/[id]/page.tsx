/* eslint-disable */
"use client"

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Gavel, Scale, User, Check, X, FileText } from "lucide-react"
import { ARBITER_ADAPTER_ABI, SIMPLE_ARBITER_ADAPTER_ADDRESS } from '@/lib/constants'; // Assuming these exist

export default function DisputeClientPage() {
    const params = useParams();
    const router = useRouter();
    const disputeId = BigInt(params.id as string);
    const { address: userAddress } = useAccount();

    // 1. Fetch Dispute Details from Adapter
    // Note: In strict implementation, we'd need to know WHICH adapter and use events to find the escrow.
    // For MVP, we use the known SimpleArbiterAdapter address.
    const adapterAddress = process.env.NEXT_PUBLIC_ARBITER_ADAPTER_ADDRESS as `0x${string}`;

    const { data: hash, writeContract, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    const handleRuling = (resolutionType: number) => {
        if (!adapterAddress) return alert("Adapter address not configured");
        writeContract({
            address: adapterAddress,
            abi: ARBITER_ADAPTER_ABI, // We will need to import this properly
            functionName: 'resolveDispute',
            args: [disputeId, resolutionType] // 4 = RELEASED, 5 = REFUNDED
        });
    };

    // Mock Data for UI Dev (since we might not have a live dispute to test easily)
    const dispute = {
        id: disputeId.toString(),
        escrow: "0x123...abc",
        milestoneId: 2,
        title: "Frontend Coding",
        reason: "Deliverable does not match requirements",
        status: "OPEN", // OPEN, RESOLVED
        payee: "0xFreelancer...",
        payer: "0xClient...",
        arbiter: "0xArbiter..." // You
    };

    const isArbiter = true; // Mock role for dev

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto w-full space-y-8 py-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-900/20 mb-4">
                        <Scale className="h-6 w-6 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-50">Resolution Center</h1>
                    <p className="text-neutral-400">
                        A dispute has been raised regarding <span className="text-neutral-200 font-medium">Milestone {dispute.milestoneId}: {dispute.title}</span>
                    </p>
                    <p className="text-sm text-neutral-500">Please review the evidence below to reach a fair decision.</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_350px]">

                    {/* Left: Evidence & Claims */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-neutral-200">Evidence & Claims</h3>

                        {/* Chat / Timeline */}
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardContent className="p-6 space-y-6">
                                {/* Complaint */}
                                <div className="flex gap-4">
                                    <Avatar>
                                        <AvatarFallback className="bg-neutral-800 text-neutral-400"><User className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-neutral-200">Client (Payer)</span>
                                            <Badge variant="destructive" className="bg-red-900/30 text-red-400 border-red-900">Complaint</Badge>
                                        </div>
                                        <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800 text-sm text-neutral-300">
                                            The worker submitted code that doesn't match the design files. Several buttons are missing and the mobile view is completely broken. I asked for fixes 3 days ago and received no response.
                                        </div>
                                        <div className="text-xs text-neutral-500">Oct 24, 14:20</div>
                                    </div>
                                </div>

                                {/* Defense */}
                                <div className="flex gap-4">
                                    <Avatar>
                                        <AvatarFallback className="bg-neutral-800 text-neutral-400"><User className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-neutral-200">Freelancer (Payee)</span>
                                            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Defense</Badge>
                                        </div>
                                        <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800 text-sm text-neutral-300">
                                            I delivered the code as per the original spec. The 'missing' buttons were not in the signed agreement. I am happy to fix the mobile view, but I need the payment for this milestone released first as per our chat.
                                        </div>
                                        <div className="text-xs text-neutral-500">Oct 25, 09:12</div>
                                    </div>
                                </div>

                                {/* Evidence File */}
                                <div className="ml-14 bg-neutral-950 border border-neutral-800 rounded p-3 flex items-center gap-3 w-fit">
                                    <FileText className="h-4 w-4 text-neutral-400" />
                                    <span className="text-sm text-neutral-300 underline cursor-pointer">source_code_v1.zip</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Reply Box (If Party) */}
                        {!isArbiter && (
                            <div className="flex gap-2">
                                <Textarea placeholder="Add a comment or evidence..." className="min-h-[80px] bg-neutral-900 border-neutral-800" />
                                <Button className="h-[80px]">Send</Button>
                            </div>
                        )}
                    </div>

                    {/* Right: Decision Panel */}
                    <div className="space-y-6">
                        <Card className="border-red-900/30 bg-red-950/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-500">
                                    <AlertTriangle className="h-5 w-5" /> Final Decision
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-neutral-400">
                                    As the appointed arbiter, your decision is final and will instantly move funds from the vault. Please choose the most fair outcome.
                                </p>

                                <div className="space-y-2">
                                    <Button
                                        onClick={() => handleRuling(4)}
                                        disabled={isPending || isConfirming || isConfirmed}
                                        className="w-full justify-start bg-emerald-900/20 text-emerald-500 hover:bg-emerald-900/40 border border-emerald-900/50"
                                    >
                                        <Check className="h-4 w-4 mr-2" /> Release to Freelancer <span className="ml-auto text-xs opacity-70">Full Amount (Status 4)</span>
                                    </Button>
                                    <Button
                                        onClick={() => handleRuling(5)}
                                        disabled={isPending || isConfirming || isConfirmed}
                                        className="w-full justify-start bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/50"
                                    >
                                        <X className="h-4 w-4 mr-2" /> Refund to Client <span className="ml-auto text-xs opacity-70">Full Amount (Status 5)</span>
                                    </Button>

                                    {(isPending || isConfirming) && <div className="text-center text-xs text-amber-500 mt-4 animate-pulse">Processing Ruling Transaction...</div>}
                                    {isConfirmed && <div className="text-center text-xs text-emerald-500 mt-4">Dispute Successfully Resolved!</div>}
                                </div>

                                <Separator className="bg-red-900/20" />

                                <div className="text-[10px] text-neutral-500">
                                    <strong>DECISION POLICY:</strong> Decisions must be based solely on the evidence provided in the contract chat and delivered files.
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
