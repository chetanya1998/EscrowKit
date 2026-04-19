
"use client"

import { useDashboardData } from "@/hooks/useDashboardData"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, ArrowUpRight, ShieldCheck, Zap, Lock, CheckCircle, LayoutTemplate, Wallet, Rocket, Activity, ChevronRight, Briefcase, Key, FileCode2 } from "lucide-react"
import { OnboardingTour } from "@/components/dashboard/OnboardingTour"
import Link from "next/link"

export function DashboardView({ role }: { role?: 'payer' | 'payee' | 'admin' }) {
    const { stats, transactions, isLoading, isFetching, error } = useDashboardData(role)
    const isGithubPages = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'gh-pages';

    if (isLoading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-neutral-500 animate-pulse">
                <div className="h-10 w-10 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
                <p>Loading your dashboard...</p>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col gap-10 mt-2 animate-in fade-in duration-700">
            <OnboardingTour />
            {/* Premium Hero Section - Now for everyone */}
            <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 p-8 md:p-10 lg:p-12 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-500/20 via-neutral-900 to-neutral-900 opacity-60"></div>
                <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-60"></div>
                
                <div className="relative z-10 max-w-3xl">
                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 mb-6 px-3 py-1 text-xs">
                        {transactions.length > 0 ? 'Dashboard Overview' : 'Welcome to EscrowKit'}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 leading-[1.2]">
                        {transactions.length > 0 ? 'Manage your secure' : 'Secure your assets with'} <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                            Trustless Smart Contracts
                        </span>
                    </h1>
                    <p className="text-base md:text-lg text-neutral-400 mb-8 leading-relaxed max-w-2xl">
                        {transactions.length > 0 
                            ? 'Monitor your ongoing agreements and execute new secure payments using our battle-tested escrow templates.'
                            : 'Start executing secure, transparent agreements on-chain. Choose from our templates to create your first escrow in seconds.'
                        }
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/dashboard/templates">
                            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-12 px-6 rounded-full gap-2 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] text-sm group">
                                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                                Create New Escrow
                            </Button>
                        </Link>
                        <Link href="/dashboard/contracts">
                            <Button size="lg" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white h-12 px-6 rounded-full text-neutral-300 gap-2 transition-all text-sm backdrop-blur-md">
                                <FileCode2 className="h-4 w-4" />
                                Explore Contracts
                            </Button>
                        </Link>
                    </div>
                </div>
                
                {/* Decorative Background Icon */}
                <div className="absolute -right-10 -bottom-20 opacity-[0.02] pointer-events-none transform -rotate-12">
                    <ShieldCheck className="w-[400px] h-[400px]" />
                </div>
            </div>

            {/* Popular Templates Quick-Launch */}
            <div id="quick-launch" className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-indigo-400" />
                        Quick Launch Templates
                    </h2>
                    <Link href="/dashboard/templates" className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 transition-colors">
                        All templates <ChevronRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                    <TemplateCard 
                        title="Milestone Escrow" 
                        description="Progressive release funds based on project phases."
                        icon={<Activity className="h-5 w-5 text-cyan-400" />}
                        gradient="from-cyan-500/10 via-cyan-500/5 to-transparent"
                        href="/dashboard/templates/milestone"
                    />
                    <TemplateCard 
                        title="Service Escrow" 
                        description="Secure holding for one-off freelance or expert work."
                        icon={<Briefcase className="h-5 w-5 text-purple-400" />}
                        gradient="from-purple-500/10 via-purple-500/5 to-transparent"
                        href="/dashboard/templates/service"
                    />
                    <TemplateCard 
                        title="Vendor Escrow" 
                        description="Complex B2B agreements with custom token settlement."
                        icon={<Key className="h-5 w-5 text-amber-400" />}
                        gradient="from-amber-500/10 via-amber-500/5 to-transparent"
                        href="/dashboard/templates/vendor"
                    />
                </div>
            </div>

            <div className="h-px bg-white/5 w-full"></div>

            {/* Error State */}
            {!isGithubPages && error && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 backdrop-blur-sm">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-sm text-amber-200 font-medium">
                        Unable to sync latest on-chain data.{' '}
                        {isFetching && <span className="text-amber-500/80">Retrying connection...</span>}
                    </p>
                </div>
            )}

            {/* Metrics Grid */}
            <div id="metrics-grid" className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard 
                    title="Total Volume" 
                    value={`${stats?.totalVolume || "0"} ETH`}
                    subtitle="+12% from last month"
                    icon={<Wallet className="h-4 w-4 text-emerald-400" />}
                    trend="up"
                />
                <MetricCard 
                    title="Active Escrows" 
                    value={stats?.activeEscrows || "0"}
                    subtitle="Ongoing secure contracts"
                    icon={<Zap className="h-4 w-4 text-amber-400" />}
                />
                <MetricCard 
                    title="Indexed Transacts" 
                    value={transactions.length}
                    subtitle="Backed by on-chain history"
                    icon={<Lock className="h-4 w-4 text-indigo-400" />}
                />
                <MetricCard 
                    title="Completed" 
                    value={stats?.completedEscrows || "0"}
                    subtitle="Successfully disbursed"
                    icon={<CheckCircle className="h-4 w-4 text-cyan-400" />}
                />
            </div>

            {/* Recent Activity + Sidebar */}
            <div id="recent-activity" className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                
                <Card className="col-span-2 bg-neutral-900/50 backdrop-blur-md border-white/5 shadow-xl rounded-2xl overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-5">
                        <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
                        <Button variant="ghost" className="text-xs font-medium text-neutral-400 hover:text-white h-8 rounded-full px-4 hover:bg-white/5">View All</Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 hover:bg-transparent px-6 text-neutral-500">
                                    <TableHead className="text-xs uppercase tracking-wider pl-6">Project / Milestone</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider">Role</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider">Amount</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="text-right pr-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? (
                                    transactions.slice(0, 5).map((tx: any) => (
                                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-semibold text-neutral-200 group-hover:text-white transition-colors">{tx.description || "Escrow #" + tx.id}</span>
                                                    <span className="text-[10px] text-neutral-500 flex items-center gap-1.5 uppercase font-medium tracking-tighter">
                                                        <span className="h-1 w-1 rounded-full bg-neutral-600"></span> Deployed Contract
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-neutral-400 text-sm font-medium capitalize">{tx.type === 'created' ? 'Payer' : 'Payee'}</TableCell>
                                            <TableCell className="text-neutral-200 font-semibold">{tx.amount} <span className="text-neutral-500 text-xs">{tx.currency}</span></TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        tx.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-medium' :
                                                            tx.status === 'pending' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400 font-medium' : 
                                                            'border-neutral-700 bg-neutral-800 text-neutral-300 font-medium'
                                                    }
                                                >
                                                    <span className={`h-1 w-1 rounded-full mr-2 ${tx.status === 'completed' ? 'bg-emerald-400' : tx.status === 'pending' ? 'bg-amber-400' : 'bg-neutral-500'}`}></span>
                                                    {tx.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Link href={`/escrow?address=${tx.address || tx.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-500 hover:text-white hover:bg-white/10 transition-colors">
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-2 text-neutral-500">
                                                <div className="h-10 w-10 border-2 border-dashed border-neutral-700 rounded-full flex items-center justify-center">
                                                    <Activity className="h-4 w-4" />
                                                </div>
                                                <p className="text-sm italic">No recent transactions found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {/* Secondary Quick Action */}
                    <Card className="bg-gradient-to-br from-indigo-900/40 via-neutral-900 to-neutral-900 border-white/10 rounded-2xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <CardHeader className="relative z-10 pb-4">
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                                <LayoutTemplate className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg text-white mb-1">Custom Wizard</CardTitle>
                            <CardDescription className="text-neutral-400 text-xs leading-relaxed">
                                Build a bespoke agreement with custom parameters and milestones.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <Link href="/dashboard/templates">
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl h-10 gap-2 transition-all text-sm">
                                    <Plus className="h-4 w-4" />
                                    Launch Wizard
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* System Notifications */}
                    <Card className="bg-neutral-900/50 backdrop-blur-md border-white/5 rounded-2xl">
                        <CardHeader className="pb-4 pt-5 px-6">
                            <CardTitle className="text-sm font-semibold text-neutral-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-indigo-400" />
                                    Security Monitoring
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 px-6 pb-6 text-[10px]">
                            {/* Static notifications for flavor */}
                            <div className="relative pl-4">
                                <div className="absolute left-0 top-1.5 h-full w-[2px] bg-emerald-500/20 rounded-full">
                                    <div className="absolute top-0 left-[-3px] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-neutral-200">System Healthy</span>
                                    <span className="text-neutral-400 italic">Smart contract indexers are synced with mainnet.</span>
                                </div>
                            </div>
                            <div className="relative pl-4">
                                <div className="absolute left-0 top-1.5 h-full w-[2px] bg-indigo-500/20 rounded-full">
                                    <div className="absolute top-0 left-[-3px] h-2 w-2 rounded-full bg-indigo-400"></div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-neutral-200">Protocol Escrows v2</span>
                                    <span className="text-neutral-400">Stable release active. All contracts are verified.</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ title, value, subtitle, icon, trend }: { title: string, value: string | number, subtitle: string, icon: React.ReactNode, trend?: 'up' | 'down' }) {
    return (
        <Card className="bg-neutral-900/50 backdrop-blur-sm border-white/5 rounded-2xl hover:bg-neutral-900/80 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
                {icon}
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-medium text-neutral-400 z-10">
                    {title}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center z-10">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 z-10 relative">
                <div className="text-3xl font-bold text-white mb-2 tracking-tight">{value}</div>
                <p className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
                    {trend === 'up' && <span className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-md flex items-center">+12%</span>}
                    {trend === 'down' && <span className="text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded-md flex items-center">-4%</span>}
                    {subtitle}
                </p>
            </CardContent>
        </Card>
    )
}

function TemplateCard({ title, description, icon, gradient, href }: { title: string, description: string, icon: React.ReactNode, gradient: string, href: string }) {
    return (
        <Link href={href} className="block group">
            <div className={`h-full relative overflow-hidden rounded-2xl bg-neutral-900/80 border border-white/5 p-6 transition-all duration-300 hover:border-white/10 hover:-translate-y-1 hover:shadow-xl`}>
                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${gradient} opacity-50 transition-opacity group-hover:opacity-100`}></div>
                <div className="absolute top-0 right-0 p-6 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-white">
                    <ArrowUpRight className="h-5 w-5" />
                </div>
                
                <div className="relative z-10">
                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    )
}

