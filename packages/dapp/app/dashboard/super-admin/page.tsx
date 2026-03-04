"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, TrendingUp, Users, Activity } from "lucide-react"

export default function SuperAdminDashboard() {
    return (
        <div className="flex flex-col gap-8 mt-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-50 mb-2">Protocol Mastery</h1>
                <p className="text-neutral-400">High-level view of all EscrowKit smart contracts and marketplace integrators.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Total Value Locked</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-50">$4.2M</div>
                        <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                            <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400 font-medium">+24%</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Protocol Escrows</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-50">1,248</div>
                        <p className="text-xs text-neutral-500 mt-2">Deployed globally</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Active Integrators</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-50">34</div>
                        <p className="text-xs text-neutral-500 mt-2">Marketplaces using the SDK</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Protocol Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-50">12.5 ETH</div>
                        <p className="text-xs text-neutral-500 mt-2">Accumulated fees</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-neutral-900 border-neutral-800 col-span-2">
                <CardHeader>
                    <CardTitle className="text-neutral-50">System Status & Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-neutral-400">All smart contracts are operating normally. Factory contract is unpaused.</p>
                </CardContent>
            </Card>
        </div>
    )
}
