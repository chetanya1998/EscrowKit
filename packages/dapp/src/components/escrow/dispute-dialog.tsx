
"use client"

import { useState, useEffect } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Loader2, Gavel } from "lucide-react"
import { parseEther, formatEther, Address } from "viem"
import { MILESTONE_ESCROW_ABI } from "@/lib/constants"
import { toast } from "sonner"

// Minimal ABI to get dispute cost from Adapter
const ADAPTER_ABI = [
    {
        name: 'getDisputeCost',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'submitEvidence',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_disputeID', type: 'uint256' },
            { name: '_evidence', type: 'string' }
        ],
        outputs: []
    }
] as const;

interface DisputeDialogProps {
    escrowAddress: string
    milestoneId: number
    milestoneIndex: number // Display index (0-based)
    arbitrationAdapter: string
    onDisputeOpened?: () => void
}

export function DisputeDialog({ escrowAddress, milestoneId, milestoneIndex, arbitrationAdapter, onDisputeOpened }: DisputeDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [reason, setReason] = useState("")
    const [step, setStep] = useState<'IDLE' | 'OPENING' | 'EVIDENCE' | 'DONE'>('IDLE')

    // Read Arbitration Cost
    const { data: cost } = useReadContract({
        address: arbitrationAdapter as Address,
        abi: ADAPTER_ABI,
        functionName: 'getDisputeCost',
    })

    const arbitrationFee = cost ? BigInt(cost) : parseEther("0.01"); // Fallback

    // -- Contract Writes --
    const { writeContractAsync: openDispute, isPending: isOpening } = useWriteContract()
    const { writeContractAsync: submitEv, isPending: isSubmitting } = useWriteContract()

    const handleOpenDispute = async () => {
        try {
            setStep('OPENING')
            toast.info("Please confirm transaction to open dispute...")

            const hash = await openDispute({
                address: escrowAddress as Address,
                abi: MILESTONE_ESCROW_ABI,
                functionName: 'openDispute',
                args: [BigInt(milestoneId)],
                value: arbitrationFee
            })

            toast.success("Dispute transaction sent! Waiting for confirmation...")
            // In a real app we'd wait for receipt here to get the DisputeID for evidence
            // But waiting for receipt in React component with just hash is tricky without hook
            // For MVP, we'll just close or move to 'DONE' and tell them to add evidence later/separately
            // Or we assume next step.

            setStep('DONE')
            setIsOpen(false)
            if (onDisputeOpened) onDisputeOpened()

        } catch (error) {
            console.error(error)
            toast.error("Failed to open dispute")
            setStep('IDLE')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 w-full justify-start">
                    <Gavel className="w-4 h-4 mr-2" /> Raise Dispute
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-5 w-5" /> Raise Dispute for Milestone #{milestoneIndex + 1}
                    </DialogTitle>
                    <DialogDescription>
                        This will summon a Kleros juror to arbitrate. You must deposit the arbitration fee.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Arbitration Fee (Required)</Label>
                        <div className="p-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-emerald-500">
                            {formatEther(arbitrationFee)} ETH
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Reason / Evidence (Optional)</Label>
                        <Textarea
                            placeholder="Describe the issue..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-neutral-950 border-neutral-800"
                        />
                        <p className="text-xs text-neutral-500">
                            You can submit detailed evidence (screenshots, logs) later via the Evidence Portal.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={step === 'OPENING'}>Cancel</Button>
                    <Button
                        onClick={handleOpenDispute}
                        disabled={step === 'OPENING' || !cost}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {step === 'OPENING' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gavel className="h-4 w-4 mr-2" />}
                        {step === 'OPENING' ? "Opening..." : `Pay ${formatEther(arbitrationFee)} ETH & Dispute`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
