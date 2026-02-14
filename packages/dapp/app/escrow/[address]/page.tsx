
"use client"

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, formatEther, parseEther } from 'viem';
import { useEscrow, Milestone } from '@/hooks/useEscrow';
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, MessageSquare, FileText, CheckCircle2, Clock, Lock, AlertTriangle, ChevronRight, Play, Check, ShieldCheck, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from 'next/link';
import { MILESTONE_ESCROW_ABI } from '@/lib/constants';
import { MilestoneProposal } from "@/components/escrow/milestone-proposal"
import { DisputeDialog } from "@/components/escrow/dispute-dialog"

export default function EscrowClientPage() {
    const params = useParams();
    const router = useRouter();
    const address = params.address as Address;
    const { address: userAddress } = useAccount();
    const { milestones, details, rentalDetails, type, isLoading, refetch, isError } = useEscrow(address);

    const isPayer = userAddress && details?.payer && userAddress.toLowerCase() === details.payer.toLowerCase();
    const isPayee = userAddress && details?.payee && userAddress.toLowerCase() === details.payee.toLowerCase();
    const isArbiter = userAddress && details?.arbiter && userAddress.toLowerCase() === details.arbiter.toLowerCase();


    // Calculate Progress
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 3).length; // RELEASED
    const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    const totalValue = milestones.reduce((acc, m) => acc + m.amount, 0n);
    const releasedValue = milestones.filter(m => m.status === 3).reduce((acc, m) => acc + m.amount, 0n);

    // Contract Write Hooks
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    React.useEffect(() => {
        if (isSuccess) refetch();
    }, [isSuccess, refetch]);

    const handleApprove = (id: number) => {
        writeContract({
            address,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'approveMilestone',
            args: [BigInt(id)],
        });
    };

    const handleSubmit = (id: number) => {
        // Mock hash for MVP
        const mockHash = "0x" + "1".repeat(64);
        writeContract({
            address,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'submitDeliverable',
            args: [BigInt(id), mockHash as `0x${string}`],
        });
    };

    const handleFund = () => {
        // Funding logic - assumes ETH for now
        // Calculate pending amount
        const pendingAmount = milestones.filter(m => m.status === 0).reduce((acc, m) => acc + m.amount, 0n);
        writeContract({
            address,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'fund',
            value: pendingAmount,
        });
    }

    if (isError) {
        return (
            <DashboardLayout>
                <div className="flex h-[50vh] flex-col gap-4 items-center justify-center text-red-500">
                    <AlertTriangle className="h-8 w-8" />
                    <span>Error loading escrow details.</span>
                    <Button onClick={() => window.location.reload()} variant="outline" className="border-red-900 text-red-400 hover:bg-red-900/20">
                        Retry
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    if (isLoading || !details || type === 'loading') {
        return (
            <DashboardLayout>
                <div className="flex h-[50vh] items-center justify-center text-neutral-500">
                    Loading details...
                </div>
            </DashboardLayout>
        )
    }

    if (type === 'rental' && rentalDetails) {
        return <RentalEscrowView address={address} details={details} rentalDetails={rentalDetails} refetch={refetch} />
    }

    // --- MILESTONE ESCROW VIEW (Default) ---
    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto w-full space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Button variant="ghost" className="pl-0 text-neutral-400 hover:text-neutral-50 mb-2" onClick={() => router.push('/dashboard/escrows')}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold text-neutral-50 flex items-center gap-3">
                            {/* Project Title Placeholder - fetched from events/logs or generic */}
                            Project Escrow <span className="text-sm font-normal text-neutral-500 bg-neutral-900 px-2 py-1 rounded">#{address.slice(0, 6)}</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-2 text-sm text-neutral-400">
                            <Lock className="h-3 w-3 text-emerald-500" />
                            Funds Secured in Vault <span className="text-neutral-600">|</span> Contract ID: {address}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50">
                            <MessageSquare className="h-4 w-4 mr-2" /> Chat with Partner
                        </Button>
                        <Button variant="outline" className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50">
                            <FileText className="h-4 w-4 mr-2" /> View Contract
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                    {/* Left Column: Timeline */}
                    <div className="space-y-6">
                        {/* Negotiation for Payer/Payee */}
                        {(isPayer || isPayee) && (
                            <MilestoneProposal escrowAddress={address} role={isPayer ? 'payer' : 'payee'} />
                        )}

                        <div className="flex items-center gap-2 text-lg font-semibold text-neutral-50">
                            <Clock className="h-5 w-5 text-neutral-400" /> Progress Timeline
                        </div>

                        <div className="space-y-4">
                            {milestones.map((m, index) => {
                                const isCompleted = m.status === 3; // RELEASED
                                const isActive = m.status === 0 || m.status === 1 || m.status === 2; // PENDING/SUBMITTED/APPROVED
                                const isLocked = false;

                                return (
                                    <div key={index} className={cn(
                                        "relative border rounded-xl p-6 transition-all",
                                        isActive ? "bg-neutral-900 border-neutral-700 ring-1 ring-neutral-700" : "bg-neutral-950/50 border-neutral-900 opacity-80 hover:opacity-100"
                                    )}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-full border",
                                                    isCompleted ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" :
                                                        isActive ? "bg-amber-500/10 border-amber-500 text-amber-500" :
                                                            "bg-neutral-800 border-neutral-700 text-neutral-500"
                                                )}>
                                                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> :
                                                        isActive ? <Play className="h-4 w-4 fill-current" /> :
                                                            <Lock className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <h3 className={cn("font-semibold text-lg", isActive ? "text-neutral-50" : "text-neutral-400")}>{m.description} <span className="text-sm font-normal text-neutral-600">#{index + 1}</span></h3>
                                                    <p className="text-sm text-neutral-500 hidden sm:block">Implementation of the landing page and components.</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-medium text-neutral-200">{formatEther(m.amount)} ETH</div>
                                            </div>
                                        </div>

                                        {/* Action Area for Active Step */}
                                        {isActive && (
                                            <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-wrap gap-2">
                                                {/* Payer Actions */}
                                                {isPayer && m.status === 1 && (
                                                    <Button onClick={() => handleApprove(index)} disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                                                        Approve & Send Payment
                                                    </Button>
                                                )}
                                                {isPayer && m.status === 0 && (
                                                    <Button variant="secondary" disabled className="bg-neutral-800 text-neutral-400 cursor-not-allowed">
                                                        Waiting for Submission
                                                    </Button>
                                                )}

                                                {/* Payee Actions */}
                                                {isPayee && m.status === 0 && (
                                                    <Button onClick={() => handleSubmit(index)} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                        Submit Work
                                                    </Button>
                                                )}
                                                {isPayee && m.status === 1 && (
                                                    <Button variant="secondary" disabled className="bg-neutral-800 text-neutral-400">
                                                        Submitted - Waiting Approval
                                                    </Button>
                                                )}

                                                {/* Common Actions */}
                                                {(m.status === 0 || m.status === 1) && (
                                                    <>
                                                        <Button variant="outline" className="border-neutral-700 hover:bg-neutral-800 text-neutral-300">Request Changes</Button>
                                                        <DisputeDialog
                                                            escrowAddress={address}
                                                            milestoneId={index}
                                                            milestoneIndex={index}
                                                            arbitrationAdapter={details.arbitrationAdapter}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right Column: Info */}
                    <div className="space-y-6">
                        {/* Vault Info */}
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure Vault Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400">Total Project Value</span>
                                    <span className="font-mono text-neutral-50">{formatEther(totalValue)} ETH</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400">Released to Worker</span>
                                    <span className="font-mono text-emerald-500">{formatEther(releasedValue)} ETH</span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-wider">
                                        <span>Progress</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-1.5" />
                                </div>

                                <div className="bg-neutral-950/50 p-3 rounded text-xs text-neutral-500 italic">
                                    Funds are held in a neutral digital vault. They are only released when you approve the work or an arbiter decides a dispute.
                                </div>

                                {/* Fund Button if Payer and not fully funded? For now assume pre-funded or per-milestone funding logic needs to be checked. */}
                                {/* If current logic isFundAll, we assume funded. If not, showing 'Fund' button is good. */}
                                {isPayer && (
                                    <Button onClick={handleFund} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                                        Fund Escrow
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Participants */}
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-neutral-300">Participants</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ParticipantRow label="Payer (Client)" address={details.payer} isYou={isPayer} />
                                <ParticipantRow label="Example Payee" address={details.payee} isYou={isPayee} />
                                <ParticipantRow label="Neutral Arbiter" address={details.arbiter || "0x000...000"} isYou={isArbiter} isBadge />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

// --- RENTAL VIEW COMPONENT ---
// (Normally I would put this in a separate file, e.g., components/rental/RentalEscrowView.tsx)
import { RENTAL_ESCROW_ABI } from '@/lib/constants';
import { EscrowDetails, RentalDetails } from '@/hooks/useEscrow';

function RentalEscrowView({ address, details, rentalDetails, refetch }: { address: Address, details: EscrowDetails, rentalDetails: RentalDetails, refetch: () => void }) {
    const router = useRouter();
    const { address: userAddress } = useAccount();
    const isLandlord = userAddress && details.payee && userAddress.toLowerCase() === details.payee.toLowerCase();
    const isTenant = userAddress && details.payer && userAddress.toLowerCase() === details.payer.toLowerCase();

    // Rental Status: 0=AWAITING, 1=ACTIVE, 2=CLAIM_PENDING, 3=DISPUTED, 4=ENDED
    const status = rentalDetails.status;
    const isClaimPending = status === 2;

    const { writeContract, isPending, data: hash } = useWriteContract();
    const { isSuccess } = useWaitForTransactionReceipt({ hash });

    React.useEffect(() => {
        if (isSuccess) refetch();
    }, [isSuccess, refetch]);

    const handleClaim = () => {
        const amount = prompt("Enter claim amount (ETH):", "0");
        if (amount === null) return;
        writeContract({
            address,
            abi: RENTAL_ESCROW_ABI,
            functionName: 'claim',
            args: [parseEther(amount), "End of Lease Claim"], // Hardcoded reason for MVP
        });
    };

    const handleAccept = () => {
        writeContract({
            address,
            abi: RENTAL_ESCROW_ABI,
            functionName: 'acceptClaim',
        });
    }

    const handleDispute = () => {
        writeContract({
            address,
            abi: RENTAL_ESCROW_ABI,
            functionName: 'disputeClaim',
            value: parseEther("0.01"), // Arbitration fee (hardcoded for now, should read from config)
        });
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto w-full space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Button variant="ghost" className="pl-0 text-neutral-400 hover:text-neutral-50 mb-2" onClick={() => router.push('/dashboard/escrows')}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold text-neutral-50 flex items-center gap-3">
                            Rental Agreement <Badge variant="outline" className="text-blue-400 border-blue-900 bg-blue-900/10">Rental</Badge>
                        </h1>
                        <div className="flex items-center gap-2 mt-2 text-sm text-neutral-400">
                            <Lock className="h-3 w-3 text-emerald-500" />
                            Security Deposit Locked <span className="text-neutral-600">|</span> {address}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Status Card */}
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-neutral-100">
                                <Activity className="h-5 w-5 text-blue-500" /> Current Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center justify-center p-6 bg-neutral-950/50 rounded-lg border border-neutral-800">
                                {status === 0 && <span className="text-neutral-400">Awaiting Deposit</span>}
                                {status === 1 && <span className="text-emerald-500 font-bold text-xl">Active Lease</span>}
                                {status === 2 && <span className="text-amber-500 font-bold text-xl">Claim Pending</span>}
                                {status === 3 && <span className="text-red-500 font-bold text-xl">Disputed</span>}
                                {status === 4 && <span className="text-neutral-400 font-bold text-xl">Ended</span>}
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                {isLandlord && status === 1 && (
                                    <Button onClick={handleClaim} disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                        End Lease & Make Claim / Return Deposit
                                    </Button>
                                )}

                                {isTenant && isClaimPending && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button onClick={handleAccept} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                            Accept Claim
                                        </Button>
                                        <Button onClick={handleDispute} disabled={isPending} variant="destructive">
                                            Dispute Claim
                                        </Button>
                                    </div>
                                )}

                                {isClaimPending && (
                                    <div className="bg-amber-900/10 border border-amber-900/30 p-3 rounded text-sm text-amber-500">
                                        Landlord is claiming <strong>{formatEther(rentalDetails.claimAmount)} ETH</strong>.
                                        Deposit remaining: <strong>{formatEther(rentalDetails.depositAmount - rentalDetails.claimAmount)} ETH</strong> will be returned to Tenant.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details Card */}
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader>
                            <CardTitle className="text-neutral-100">Deposit Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400">Total Deposit</span>
                                <span className="font-mono text-neutral-50">{formatEther(rentalDetails.depositAmount)} ETH</span>
                            </div>
                            <Separator className="bg-neutral-800" />
                            <ParticipantRow label="Landlord" address={details.payee} isYou={isLandlord} />
                            <ParticipantRow label="Tenant" address={details.payer} isYou={isTenant} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );


}

function ParticipantRow({ label, address, isYou, isBadge }: { label: string, address: string, isYou?: boolean, isBadge?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral-500 uppercase flex items-center gap-1">
                    {label} {isYou && <span className="bg-neutral-800 text-neutral-300 px-1 rounded text-[9px] py-0.5">YOU</span>}
                </span>
                <span className="text-sm font-medium text-neutral-300">User</span>
            </div>
            {isBadge ? (
                <Badge variant="secondary" className="font-mono text-xs text-neutral-400 bg-neutral-800">System</Badge>
            ) : (
                <div className="bg-neutral-950 px-2 py-1 rounded border border-neutral-800 font-mono text-xs text-neutral-500">
                    {address?.slice(0, 4)}...{address?.slice(-4)}
                </div>
            )}
        </div>
    )
}
