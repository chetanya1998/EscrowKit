"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlatform } from "@/contexts/PlatformContext";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Webhook, Lock, Zap, CheckCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useDeveloperEscrows } from "@/hooks/useDeveloperPlatform";

export default function ProjectDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.orgId as string;
    const projectId = params.projectId as string;
    
    const { 
        setSelectedOrganizationId, 
        setSelectedProjectId,
        selectedOrganizationId,
        selectedProjectId,
        activeProject,
        isBootstrapping,
        isAuthenticated
    } = usePlatform();

    // Sync URL params to global platform context
    useEffect(() => {
        if (orgId && projectId) {
            if (selectedOrganizationId !== orgId) {
                setSelectedOrganizationId(orgId);
            }
            if (selectedProjectId !== projectId) {
                setSelectedProjectId(projectId);
            }
        }
    }, [orgId, projectId, selectedOrganizationId, selectedProjectId, setSelectedOrganizationId, setSelectedProjectId]);

    if (isBootstrapping || !isAuthenticated || activeProject?.id !== projectId) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-neutral-500">
                Loading project environment...
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-8 mt-4">
                {/* Header Section */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-50 mb-2">{activeProject?.name || 'Project'} Dashboard</h1>
                    <p className="text-neutral-400">Monitor and manage your secure milestone-based payments for this project.</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-400">
                                Active Contracts
                            </CardTitle>
                            <Zap className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-50">--</div>
                            <p className="text-xs text-neutral-500 mt-2">
                                Data synced from EscrowKit Engine
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-400">
                                Total Volume
                            </CardTitle>
                            <Lock className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-50">--</div>
                            <p className="text-xs text-neutral-500 mt-2">
                                Escrow volume within project
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content: Activity + Quick Actions */}
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                    
                    {/* Recent Activity Table using our Refactored TransactionList! */}
                    <div className="col-span-2">
                        <TransactionList />
                    </div>

                    <div className="space-y-4">
                        {/* Quick Action: New Escrow from Template */}
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center mb-2">
                                    <Plus className="h-5 w-5 text-neutral-50" />
                                </div>
                                <CardTitle className="text-neutral-50">Create Escrow</CardTitle>
                                <CardDescription className="text-neutral-400">
                                    Initialize a new trustless transaction within this project.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/escrow/create">
                                    <Button className="w-full bg-white text-black hover:bg-neutral-200 font-semibold gap-2">
                                        <Plus className="h-4 w-4" />
                                        Launch Escrow
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* System Notifications */}
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-amber-500 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    Environment Context
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-1 border-l-2 border-emerald-500/30 pl-3">
                                    <span className="text-xs font-medium text-emerald-400">Scoped Context</span>
                                    <span className="text-xs text-neutral-500">You are viewing escrows isolated to the {activeProject?.name} scope.</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
