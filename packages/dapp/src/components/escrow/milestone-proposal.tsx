
"use client"

import { useState, useEffect } from "react"
import { useAccount, useSignTypedData, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, PenTool, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { parseEther, formatEther } from "viem"
import { MILESTONE_ESCROW_ABI } from "@/lib/constants"

interface MilestoneDraft {
    id: string
    title: string
    description: string
    amount: string
    deadline: string
    status: string // PENDING, SIGNED, REJECTED, COMMITTED
    isSigned: boolean
    creator: string
}

interface MilestoneProposalProps {
    escrowAddress: string
    role: "payer" | "payee" | "arbiter" | "viewer"
}

export function MilestoneProposal({ escrowAddress, role }: MilestoneProposalProps) {
    const { address } = useAccount()
    const { signTypedDataAsync } = useSignTypedData()
    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

    const [drafts, setDrafts] = useState<MilestoneDraft[]>([])
    const [loading, setLoading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form State
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [deadline, setDeadline] = useState("")

    useEffect(() => {
        fetchDrafts()
    }, [escrowAddress, isConfirmed]) // Refresh on load and after commit

    const fetchDrafts = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/v1/drafts/${escrowAddress}`)
            if (res.ok) {
                const data = await res.json()
                setDrafts(data)
            }
        } catch (error) {
            console.error("Failed to fetch drafts", error)
        }
    }

    const createDraft = async () => {
        if (!address || !title || !amount) return
        setLoading(true)
        try {
            const res = await fetch(`http://localhost:3001/api/v1/drafts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    escrowAddress,
                    title,
                    description,
                    amount: amount, // Backend expects string representation of ETH
                    deadline: new Date(deadline || Date.now() + 86400000 * 30), // Default 30 days
                    creator: address
                })
            })

            if (res.ok) {
                toast.success("Draft Created")
                setIsDialogOpen(false)
                fetchDrafts()
                // Reset form
                setTitle("")
                setDescription("")
                setAmount("")
                setDeadline("")
            } else {
                toast.error("Failed to create draft")
            }
        } catch (error) {
            toast.error("Error creating draft")
        } finally {
            setLoading(false)
        }
    }

    const signDraft = async (draft: MilestoneDraft) => {
        try {
            const amountWei = parseEther(draft.amount)
            const deadlineBigInt = BigInt(Math.floor(new Date(draft.deadline).getTime() / 1000))

            const domain = {
                name: 'EscrowKit',
                version: '1',
                chainId: 31337, // TODO: Dynamic Chain ID
                verifyingContract: escrowAddress as `0x${string}`
            } as const;

            const types = {
                Milestone: [
                    { name: 'title', type: 'string' },
                    { name: 'description', type: 'string' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            } as const;

            const message = {
                title: draft.title,
                description: draft.description,
                amount: amountWei,
                deadline: deadlineBigInt
            };

            const signature = await signTypedDataAsync({
                domain,
                types,
                primaryType: 'Milestone',
                message
            })

            // Send signature to backend
            const res = await fetch(`http://localhost:3001/api/v1/drafts/${draft.id}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signature, signer: address })
            })

            if (res.ok) {
                toast.success("Draft Signed")
                fetchDrafts()
            } else {
                toast.error("Failed to verify signature")
            }

        } catch (error) {
            console.error(error)
            toast.error("Error signing draft")
        }
    }

    const commitDraft = async (draft: MilestoneDraft) => {
        // Payer calling addMilestones
        const amountWei = parseEther(draft.amount)
        const deadlineTimestamp = Math.floor(new Date(draft.deadline).getTime() / 1000)

        writeContract({
            address: escrowAddress as `0x${string}`,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'addMilestones',
            args: [
                [amountWei],
                [draft.description], // Contract uses description, not title
                [BigInt(deadlineTimestamp)],
                ["0x0000000000000000000000000000000000000000000000000000000000000000"] // No condition hash for now
            ]
        })

        // Optimistic update: In a real app we'd wait for tx success then call backend to mark as COMMITTED
        // For now, useWaitForTransactionReceipt will trigger re-fetch, but draft will still show as SIGNED.
        // We should add a backend endpoint to mark as committed.
    }

    return (
        <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-neutral-50">Milestone Proposals</CardTitle>
                    <CardDescription>Draft and negotiate milestones before committing them on-chain.</CardDescription>
                </div>
                {role === 'payer' && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-black">
                                <Plus className="w-4 h-4 mr-2" /> New Proposal
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Propose New Milestone</DialogTitle>
                                <DialogDescription>Create a draft for the payee to review.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label>Title</label>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                </div>
                                <div className="grid gap-2">
                                    <label>Description</label>
                                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                </div>
                                <div className="grid gap-2">
                                    <label>Amount (ETH)</label>
                                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                </div>
                                <div className="grid gap-2">
                                    <label>Deadline</label>
                                    <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={createDraft} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Draft"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-neutral-800">
                    <Table>
                        <TableHeader className="bg-neutral-950/50">
                            <TableRow className="border-neutral-800 hover:bg-transparent">
                                <TableHead className="text-neutral-400">Title</TableHead>
                                <TableHead className="text-neutral-400">Amount</TableHead>
                                <TableHead className="text-neutral-400">Status</TableHead>
                                <TableHead className="text-right text-neutral-400">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {drafts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-neutral-500">
                                        No active proposals.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                drafts.map((draft) => (
                                    <TableRow key={draft.id} className="border-neutral-800 hover:bg-neutral-800/20">
                                        <TableCell className="font-medium text-neutral-200">
                                            {draft.title}
                                            <div className="text-xs text-neutral-500 truncate max-w-[200px]">{draft.description}</div>
                                        </TableCell>
                                        <TableCell className="text-neutral-200">{draft.amount} ETH</TableCell>
                                        <TableCell>
                                            <Badge variant={draft.isSigned ? "default" : "secondary"} className={
                                                draft.status === 'SIGNED' ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" :
                                                    draft.status === 'REJECTED' ? "bg-red-500/20 text-red-400" :
                                                        "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                            }>
                                                {draft.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Logic for Payee to Sign */}
                                            {role === 'payee' && !draft.isSigned && draft.status === 'PENDING' && (
                                                <Button size="sm" onClick={() => signDraft(draft)} className="bg-emerald-500 hover:bg-emerald-600 text-black">
                                                    <PenTool className="w-4 h-4 mr-2" /> Sign
                                                </Button>
                                            )}

                                            {/* Logic for Payer to Commit */}
                                            {role === 'payer' && draft.isSigned && draft.status === 'SIGNED' && (
                                                <Button size="sm" onClick={() => commitDraft(draft)} disabled={isWritePending || isConfirming} className="bg-blue-500 hover:bg-blue-600">
                                                    {(isWritePending || isConfirming) ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" /> Commit</>}
                                                </Button>
                                            )}

                                            {/* Payer waiting for signature */}
                                            {role === 'payer' && !draft.isSigned && (
                                                <span className="text-xs text-neutral-500 italic">Waiting for Payee...</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
