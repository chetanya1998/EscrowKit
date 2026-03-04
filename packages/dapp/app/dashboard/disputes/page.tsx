
"use client"

import { useDashboardData } from "@/hooks/useDashboardData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, Scale } from "lucide-react"
import Link from "next/link"

export default function DisputesPage() {
    const { transactions, isLoading, isFetching, error } = useDashboardData()

    // Filter for disputes
    const disputes = transactions?.filter((tx: any) => tx.status === 'disputed' || tx.type === 'disputed');

    if (isLoading) return (

        <div className="flex h-[50vh] items-center justify-center text-neutral-500">
            Loading disputes...
        </div>

    )

    return (

        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-50 mb-2">Resolution Center</h1>
                <p className="text-neutral-400">Manage disputes and arbitration cases.</p>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-sm text-amber-400">
                        Unable to reach the API — showing cached data.{' '}
                        {isFetching && <span className="text-amber-500/60">Retrying...</span>}
                    </p>
                </div>
            )}

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-neutral-50 flex items-center gap-2">
                        <Scale className="h-5 w-5 text-amber-500" />
                        Active Disputes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {(!disputes || disputes.length === 0) ? (
                        <div className="text-center py-16 space-y-4">
                            <Scale className="h-12 w-12 text-neutral-700 mx-auto" />
                            <h3 className="text-lg font-medium text-neutral-300">No Active Disputes</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto">
                                You don't have any ongoing disputes. If an issue arises with a contract, you can open a dispute from the escrow details page.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-neutral-800 hover:bg-transparent">
                                        <TableHead className="text-neutral-500 font-medium">Case ID</TableHead>
                                        <TableHead className="text-neutral-500 font-medium">Project</TableHead>
                                        <TableHead className="text-neutral-500 font-medium">Amount Locked</TableHead>
                                        <TableHead className="text-neutral-500 font-medium">Status</TableHead>
                                        <TableHead className="text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {disputes.map((tx: any) => (
                                        <TableRow key={tx.id} className="border-neutral-800 hover:bg-neutral-800/50">
                                            <TableCell className="font-medium text-neutral-300">#{tx.id}</TableCell>
                                            <TableCell className="text-neutral-300">{tx.description || "Escrow Contract"}</TableCell>
                                            <TableCell className="text-neutral-50 font-medium">{tx.amount} {tx.currency}</TableCell>
                                            <TableCell>
                                                <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
                                                    Dispute Open
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/dashboard/dispute?id=${tx.id}`}>
                                                    <Button variant="outline" size="sm" className="border-neutral-700 hover:bg-neutral-800">
                                                        View Case
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

    )
}
