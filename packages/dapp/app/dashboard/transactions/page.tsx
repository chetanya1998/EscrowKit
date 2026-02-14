
"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { useDashboardData } from "@/hooks/useDashboardData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft, ArrowUpRight as ArrowOut } from "lucide-react"

export default function TransactionsPage() {
    const { transactions, isLoading } = useDashboardData()

    if (isLoading) return (
        <DashboardLayout>
            <div className="flex h-[50vh] items-center justify-center text-neutral-500">
                Loading activity...
            </div>
        </DashboardLayout>
    )

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-50 mb-2">Transaction History</h1>
                    <p className="text-neutral-400">Ledger of all your contract interactions.</p>
                </div>

                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-neutral-50">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-neutral-800 hover:bg-transparent">
                                    <TableHead className="text-neutral-500 font-medium w-[50px]"></TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Type</TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Description</TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Date</TableHead>
                                    <TableHead className="text-neutral-500 font-medium text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions?.map((tx: any) => (
                                    <TableRow key={tx.id} className="border-neutral-800 hover:bg-neutral-800/50">
                                        <TableCell>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tx.type === 'funded' ? 'bg-red-500/10 text-red-500' :
                                                    tx.type === 'released' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        'bg-neutral-800 text-neutral-400'
                                                }`}>
                                                {tx.type === 'funded' ? <ArrowOut className="h-4 w-4" /> :
                                                    tx.type === 'released' ? <ArrowDownLeft className="h-4 w-4" /> :
                                                        <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-neutral-300 capitalize">{tx.type}</TableCell>
                                        <TableCell className="text-neutral-400">{tx.description || `Contract Interaction #${tx.id}`}</TableCell>
                                        <TableCell className="text-neutral-500 text-sm">{tx.date}</TableCell>
                                        <TableCell className={`text-right font-medium ${tx.type === 'funded' ? 'text-neutral-50' : 'text-emerald-500'
                                            }`}>
                                            {tx.type === 'funded' ? '-' : '+'}{tx.amount} {tx.currency}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!transactions || transactions.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-neutral-500 py-12">
                                            No transactions recorded yet.
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
