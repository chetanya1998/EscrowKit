"use client";

import React, { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Lock, ShieldCheck, Activity, Loader2, AlertTriangle, CheckCircle2, Play, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn, getExplorerUrl } from "@/lib/utils";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDeveloperEscrow } from "@/hooks/useDeveloperPlatform";
import { usePlatform } from "@/contexts/PlatformContext";
import { formatUnits } from "viem";
import { getTokenByAddress, ZERO_ADDRESS } from "@/lib/tokens";

function EscrowDetailsContent() {
  const { escrowId } = useParams() as { escrowId: string };
  const router = useRouter();
  const { activeEnvironment } = usePlatform();

  const { data: escrow, isLoading, isError } = useDeveloperEscrow(
    escrowId,
    true // We always try to load if we have an ID
  );

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
    );
  }

  if (isLoading || !escrow) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center text-neutral-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading details...
        </div>
      </DashboardLayout>
    );
  }

  const milestones = escrow.milestones ?? [];
  const totalMilestones = milestones.length;
  // Statuses: 0=PENDING, 1=SUBMITTED, 2=APPROVED, 3=RELEASED, 4=REFUNDED, 5=DISPUTED, etc
  const completedMilestones = milestones.filter(m => m.status === 'RELEASED' || m.status === 'REFUNDED').length;
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const totalValue = milestones.reduce((acc, m) => acc + BigInt(m.amount), 0n);
  const releasedValue = milestones.filter(m => m.status === 'RELEASED').reduce((acc, m) => acc + BigInt(m.amount), 0n);
  const pendingFundingAmount = milestones.filter(m => m.status === 'PENDING').reduce((acc, m) => acc + BigInt(m.amount), 0n);

  const tokenAddress = escrow.tokenAddress ?? ZERO_ADDRESS;
  const token = getTokenByAddress(tokenAddress);
  const tokenSymbol = token?.symbol ?? (tokenAddress === ZERO_ADDRESS ? 'ETH' : 'TOKEN');
  const tokenDecimals = token?.decimals ?? 18;

  const hasDispute = escrow.disputes && escrow.disputes.length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto w-full space-y-8 py-8">
        {hasDispute && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-4 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-500 text-lg">Active Dispute</h3>
              <p className="text-red-400/80 text-sm mt-1">This escrow contains milestones that have been disputed. Payments are paused until resolution is reached via arbitration.</p>
            </div>
            <Link href={`/dashboard/dispute?id=${escrow.address}`}>
              <Button className="bg-red-500 hover:bg-red-600 text-white shadow-none">Review Case</Button>
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button variant="ghost" className="pl-0 text-neutral-400 hover:text-neutral-50 mb-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h1 className="text-3xl font-bold text-neutral-50 flex items-center gap-3">
              {escrow.metadata?.title ? String(escrow.metadata.title) : 'Project Escrow'}
              <span className="text-sm font-normal text-neutral-500 bg-neutral-900 px-2 py-1 rounded">#{escrow.address.slice(0, 6)}</span>
            </h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-neutral-400">
              <Lock className="h-3 w-3 text-emerald-500" />
              Funds Secured in Vault <span className="text-neutral-600">|</span> Contract ID: {escrow.address}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50">
              <MessageSquare className="h-4 w-4 mr-2" /> Message
            </Button>
            <Link href={getExplorerUrl(escrow.address)} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50">
                <FileText className="h-4 w-4 mr-2" /> View Contract
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Left Column: Timeline */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-neutral-50">
              <Clock className="h-5 w-5 text-neutral-400" /> Progress Timeline
            </div>

            {milestones.length === 0 ? (
              <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-xl text-center">
                <p className="text-neutral-400">No milestones found for this escrow.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((m, index) => {
                  const isCompleted = m.status === 'RELEASED';
                  const isActive = m.status === 'PENDING' || m.status === 'SUBMITTED' || m.status === 'APPROVED';

                  return (
                    <div key={m.id} className={cn(
                      "relative border rounded-xl p-6 transition-all",
                      isActive ? "bg-neutral-900 border-neutral-700 ring-1 ring-neutral-700" : "bg-neutral-950/50 border-neutral-900 opacity-80 hover:opacity-100"
                    )}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border shrink-0",
                            isCompleted ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" :
                              isActive ? "bg-amber-500/10 border-amber-500 text-amber-500" :
                                "bg-neutral-800 border-neutral-700 text-neutral-500"
                          )}>
                            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> :
                              isActive ? <Play className="h-4 w-4 fill-current" /> :
                                <Lock className="h-4 w-4" />}
                          </div>
                          <div>
                            <h3 className={cn("font-semibold text-lg", isActive ? "text-neutral-50" : "text-neutral-400")}>
                              {m.description ? DOMPurify.sanitize(m.description) : `Milestone ${m.index + 1}`}
                              <span className="text-sm font-normal text-neutral-600 ml-2">#{m.index + 1}</span>
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={cn(
                                "text-[10px] uppercase tracking-wide",
                                m.status === 'RELEASED' ? "border-emerald-500/50 text-emerald-500" :
                                m.status === 'SUBMITTED' ? "border-amber-500/50 text-amber-500" :
                                "border-neutral-700 text-neutral-400"
                              )}>
                                {m.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium text-neutral-200">
                            {formatUnits(BigInt(m.amount), tokenDecimals)} {tokenSymbol}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Info */}
          <div className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure Vault Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Total Project Value</span>
                  <span className="font-mono text-neutral-50">{formatUnits(totalValue, tokenDecimals)} {tokenSymbol}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Released to Worker</span>
                  <span className="font-mono text-emerald-500">{formatUnits(releasedValue, tokenDecimals)} {tokenSymbol}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Pending Funding</span>
                  <span className="font-mono text-neutral-200">{formatUnits(pendingFundingAmount, tokenDecimals)} {tokenSymbol}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-wider">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-300">Participants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ParticipantRow label="Payer" address={escrow.payer} />
                <ParticipantRow label="Payee" address={escrow.payee} />
                {escrow.arbiter && escrow.arbiter !== ZERO_ADDRESS && (
                  <ParticipantRow label="Arbiter" address={escrow.arbiter} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ParticipantRow({ label, address }: { label: string; address: string }) {
  if (!address) return null;
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-neutral-500 uppercase">{label}</span>
        <span className="text-sm font-medium text-neutral-300">User</span>
      </div>
      <div className="bg-neutral-950 px-2 py-1 rounded border border-neutral-800 font-mono text-xs text-neutral-500">
        {address.slice(0, 6)}...{address.slice(-4)}
      </div>
    </div>
  );
}

export default function EscrowDetailsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    }>
      <EscrowDetailsContent />
    </Suspense>
  );
}
