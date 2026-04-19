
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
        <div id="project-overview" className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Project Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_40px_rgba(79,70,229,0.15)]">
                        <Rocket className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-white tracking-tight">Escrow-Kit</h1>
                            <Badge className="bg-neutral-800 text-[10px] text-neutral-400 border-none font-bold uppercase tracking-widest px-2 py-0.5">NANO</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <span>Project URL unavailable</span>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-neutral-500 hover:text-white bg-neutral-900/50 rounded-md gap-1.5 text-xs">
                                Copy <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:flex items-center gap-3">
                    <StatusItem icon={<Activity className="h-3.5 w-3.5" />} label="STATUS" value="Coming up..." color="text-indigo-400" />
                    <StatusItem icon={<FileCode2 className="h-3.5 w-3.5" />} label="LAST MIGRATION" value="None" />
                    <StatusItem icon={<Lock className="h-3.5 w-3.5" />} label="LAST BACKUP" value="No backups" />
                    <StatusItem icon={<ArrowUpRight className="h-3.5 w-3.5" />} label="RECENT BRANCH" value="No branches" />
                </div>
            </div>

            {/* Infrastructure Visual Section */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-neutral-900 border-white/5 rounded-2xl overflow-hidden relative group min-h-[300px]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(79,70,229,0.05),transparent_70%)]"></div>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #ffffff10 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                    
                    <CardContent className="p-8 h-full flex items-center justify-center">
                        <div className="relative group cursor-pointer">
                            <div className="absolute -inset-10 bg-indigo-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative bg-neutral-950/80 border border-white/10 rounded-2xl p-6 flex items-center gap-5 shadow-2xl backdrop-blur-xl">
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-0.5">Primary Smart Engine</h3>
                                    <p className="text-xs text-neutral-400">Multi-Chain Protocol (v1.4)</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-500 h-4 bg-emerald-500/5">ACTIVE</Badge>
                                        <span className="text-[10px] text-neutral-500 font-mono">0x...8be7a3</span>
                                    </div>
                                </div>
                                <div className="ml-4 pl-4 border-l border-white/5 flex flex-col items-center">
                                    <div className="h-5 w-8 rounded bg-neutral-900 border border-white/10 overflow-hidden flex items-center justify-center">
                                        <div className="w-full h-1/2 bg-blue-600"></div>
                                        <div className="w-full h-1/2 bg-red-600"></div>
                                    </div>
                                    <span className="text-[9px] text-neutral-600 mt-1 uppercase font-bold">ETH</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-6">
                    <QuickStartCard 
                        title="New Escrow" 
                        description="Launch a new secure agreement from templates." 
                        icon={<Plus className="h-4 w-4" />}
                        href="/dashboard/templates"
                    />
                    <QuickStartCard 
                        title="Developer Hub" 
                        description="Manage API keys and view integration logs." 
                        icon={<Key className="h-4 w-4" />}
                        href="/dashboard/developer"
                    />
                    <QuickStartCard 
                        title="Settings" 
                        description="Configure notifications and account preferences." 
                        icon={<Activity className="h-4 w-4" />}
                        href="/dashboard/settings"
                    />
                </div>
            </div>

            {/* Request Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MiniChartCard title="DATABASE REQUESTS" value="0" />
                <MiniChartCard title="AUTH REQUESTS" value="0" />
                <MiniChartCard title="STORAGE REQUESTS" value="0" />
                <MiniChartCard title="REALTIME REQUESTS" value="0" />
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

function StatusItem({ icon, label, value, color = "text-neutral-500" }: { icon: React.ReactNode, label: string, value: string, color?: string }) {
    return (
        <div className="bg-neutral-900 border border-white/5 rounded-xl p-3 flex items-center gap-3 min-w-[140px]">
            <div className={`h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-tighter leading-none mb-1">{label}</p>
                <p className="text-xs font-semibold text-neutral-300 truncate max-w-[80px]">{value}</p>
            </div>
        </div>
    )
}

function QuickStartCard({ title, description, icon, href }: { title: string, description: string, icon: React.ReactNode, href: string }) {
    return (
        <Link href={href} className="group">
            <Card className="bg-neutral-900 border-white/5 hover:border-indigo-500/30 transition-all rounded-xl p-4 flex items-center gap-4 group-hover:-translate-y-1">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    {icon}
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white mb-0.5 group-hover:text-indigo-400 transition-colors">{title}</h3>
                    <p className="text-[11px] text-neutral-500 line-clamp-1">{description}</p>
                </div>
            </Card>
        </Link>
    )
}

function MiniChartCard({ title, value }: { title: string, value: string }) {
    return (
        <Card className="bg-neutral-900 border-white/5 rounded-xl p-4 overflow-hidden relative group">
            <div className="relative z-10 flex flex-col gap-3">
                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">{title}</p>
                <div className="flex items-end justify-between gap-4">
                    <span className="text-2xl font-bold text-white">{value}</span>
                    <div className="flex items-end gap-1 h-8">
                        {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                            <div 
                                key={i} 
                                className="w-1.5 bg-indigo-500/20 rounded-t-sm group-hover:bg-indigo-500/40 transition-colors" 
                                style={{ height: `${h}%` }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
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

