
"use client"

import { useDashboardData } from "@/hooks/useDashboardData"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, ArrowUpRight, ShieldCheck, Zap, Lock, CheckCircle, LayoutTemplate } from "lucide-react"
import Link from "next/link"

export function DashboardView({ role }: { role?: 'payer' | 'payee' | 'admin' }) {
    const { stats, transactions, isLoading, isFetching, error } = useDashboardData(role)
    const isGithubPages = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'gh-pages';

    if (isLoading) return (
        <div className="flex h-[50vh] items-center justify-center text-neutral-500">
            Loading dashboard...
        </div>
    )

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-8 mt-4">
                {/* Header Section */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-50 mb-2">Trustless Escrow Engine</h1>
                    <p className="text-neutral-400">Monitor and manage your secure milestone-based payments.</p>
                </div>

                {!isGithubPages && error && (
                    <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        <p className="text-sm text-amber-400">
                            Unable to reach the API right now.{' '}
                            {isFetching && <span className="text-amber-500/60">Retrying...</span>}
                        </p>
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-400">
                                Total Volume
                            </CardTitle>
                            <WalletIcon className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-50">{stats?.totalVolume || "0"} ETH</div>
                            <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                                <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400 font-medium">+12%</span>
                                <span className="text-neutral-500">from last month</span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-400">
                                Active Escrows
                            </CardTitle>
                            <Zap className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-50">{stats?.activeEscrows || "0"}</div>
                            <p className="text-xs text-neutral-500 mt-2">
                                Ongoing contracts
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-400">
                                Indexed Escrows
                            </CardTitle>
                            <Lock className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-50">{transactions.length}</div>
                            <p className="text-xs text-neutral-500 mt-2">
                                Backed by indexed on-chain history
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-400">
                                Completed
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-neutral-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-50">{stats?.completedEscrows || "0"}</div>
                            <p className="text-xs text-neutral-500 mt-2">
                                Successfully released
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content: Activity + Quick Actions */}
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">

                    {/* Recent Activity Table */}
                    <Card className="col-span-2 bg-neutral-900 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-neutral-50">Recent Activity</CardTitle>
                            <Button variant="ghost" className="text-xs text-neutral-400 hover:text-neutral-50 h-8">View All</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-neutral-800 hover:bg-transparent">
                                        <TableHead className="text-neutral-500 font-medium">Project / Milestone</TableHead>
                                        <TableHead className="text-neutral-500 font-medium">Role</TableHead>
                                        <TableHead className="text-neutral-500 font-medium">Amount</TableHead>
                                        <TableHead className="text-neutral-500 font-medium">Status</TableHead>
                                        <TableHead className="text-neutral-500 font-medium text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions?.slice(0, 5).map((tx: any) => (
                                        <TableRow key={tx.id} className="border-neutral-800 hover:bg-neutral-800/50">
                                            <TableCell className="font-medium text-neutral-300">
                                                <div className="flex flex-col">
                                                    <span>{tx.description || "Escrow #" + tx.id}</span>
                                                    <span className="text-xs text-neutral-500 font-normal">Deployed Contract</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-neutral-400 capitalize">{tx.type === 'created' ? 'Payer' : 'Payee'}</TableCell>
                                            <TableCell className="text-neutral-50 font-medium">{tx.amount} {tx.currency}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        tx.status === 'completed' ? 'success' :
                                                            tx.status === 'pending' ? 'warning' : 'secondary'
                                                    }
                                                    className={
                                                        tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                            tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-neutral-800 text-neutral-400'
                                                    }
                                                >
                                                    {tx.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/escrow?address=${tx.address || tx.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-neutral-300">
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!transactions || transactions.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-neutral-500 py-8">
                                                No recent activity found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        {/* Quick Action: New Escrow from Template */}
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center mb-2">
                                    <LayoutTemplate className="h-5 w-5 text-neutral-50" />
                                </div>
                                <CardTitle className="text-neutral-50">Create Escrow</CardTitle>
                                <CardDescription className="text-neutral-400">
                                    Choose from predefined templates designed for your specific needs.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/dashboard/templates">
                                    <Button className="w-full bg-white text-black hover:bg-neutral-200 font-semibold gap-2">
                                        <Plus className="h-4 w-4" />
                                        Browse Templates
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* System Notifications */}
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-amber-500 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    System Notifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-1 border-l-2 border-emerald-500/30 pl-3">
                                    <span className="text-xs font-medium text-emerald-400">Funds Released</span>
                                    <span className="text-xs text-neutral-500">Milestone 1 for 'Branding' was approved.</span>
                                    <span className="text-[10px] text-neutral-600">3h ago</span>
                                </div>
                                <div className="flex flex-col gap-1 border-l-2 border-neutral-800 pl-3">
                                    <span className="text-xs font-medium text-neutral-300">Contract Deployed</span>
                                    <span className="text-xs text-neutral-500">New escrow #8291 created successfully.</span>
                                    <span className="text-[10px] text-neutral-600">5h ago</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

function WalletIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
    )
}
