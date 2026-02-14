
"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { useDashboardData } from "@/hooks/useDashboardData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

export default function EscrowsPage() {
    const { transactions, isLoading, error } = useDashboardData()

    if (isLoading) return (
        <DashboardLayout>
            <div className="flex h-[50vh] items-center justify-center text-neutral-500">
                Loading escrows...
            </div>
        </DashboardLayout>
    )

    if (error) return (
        <DashboardLayout>
            <div className="flex h-[50vh] items-center justify-center text-red-500">
                Error loading data.
            </div>
        </DashboardLayout>
    )

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-50 mb-2">My Escrows</h1>
                    <p className="text-neutral-400">View and manage all your escrow contracts.</p>
                </div>

                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-neutral-50">All Contracts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-neutral-800 hover:bg-transparent">
                                    <TableHead className="text-neutral-500 font-medium">Project</TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Role</TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Counterparty</TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Amount</TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Status</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions?.map((tx: any) => (
                                    <TableRow key={tx.id} className="border-neutral-800 hover:bg-neutral-800/50">
                                        <TableCell className="font-medium text-neutral-300">
                                            <div className="flex flex-col">
                                                <span>{tx.description || "Escrow #" + tx.id}</span>
                                                <span className="text-xs text-neutral-500 font-normal">{tx.date}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-neutral-400 capitalize">{tx.type === 'created' ? 'Payer' : 'Payee'}</TableCell>
                                        <TableCell className="text-neutral-400 font-mono text-xs">{tx.counterparty.slice(0, 6)}...{tx.counterparty.slice(-4)}</TableCell>
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
                                            <Link href={`/escrow/${tx.counterparty || tx.id}`}> {/* Link logic needs refinement, ideally link by ID but mock data uses ID */}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-neutral-300">
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!transactions || transactions.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-neutral-500 py-12">
                                            No escrows found. <Link href="/create" className="text-emerald-500 hover:underline">Create one?</Link>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
