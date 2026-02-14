
import React, { useState } from 'react';
import { Address, formatEther, parseEther, keccak256, toHex } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MILESTONE_ESCROW_ABI } from '@/lib/constants';
import { Milestone, EscrowDetails } from '@/hooks/useEscrow';

interface PayerViewProps {
    address: Address;
    milestones: Milestone[];
    details: EscrowDetails;
    refetch: () => void;
}

export function PayerView({ address, milestones, details, refetch }: PayerViewProps) {
    const { writeContract, data: hash, isPending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    React.useEffect(() => {
        if (isSuccess) {
            refetch();
        }
    }, [isSuccess, refetch]);

    const [newMilestoneAmount, setNewMilestoneAmount] = useState('');
    const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
    const [newMilestoneCondition, setNewMilestoneCondition] = useState('');
    const [updateAmount, setUpdateAmount] = useState('');
    const [updateDesc, setUpdateDesc] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    const totalAmount = milestones.reduce((acc, m) => acc + m.amount, 0n);
    // Rough check if funded (comparing contract balance would be better but this is a view component)
    // For now assuming if any milestone is RELEASED or REFUNDED it was funded.
    // Real check: call `totalFunded()` on contract or pass it in.
    // For MVP, if milestones exist and we are PayerView, we show fund button if not all done.

    const handleFund = () => {
        writeContract({
            address,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'fund',
            value: totalAmount
        });
    };

    // Calculate actual pending needed
    const pendingAmount = milestones
        .filter(m => m.status === 0) // PENDING
        .reduce((sum, m) => sum + m.amount, 0n);

    const handleFundPending = () => {
        writeContract({
            address,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'fund',
            value: pendingAmount
        });
    }

    const handleAddMilestone = () => {
        if (!newMilestoneAmount || !newMilestoneDesc) return;

        // Generate Condition Hash
        let conditionHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
        if (newMilestoneCondition) {
            // Basic hash of the description string for MVP
            // In real app: upload to IPFS -> get hash. 
            // Here we allow "mock" conditions by hashing the string directly.
            // If string starts with "Qm", we assume it is IPFS hash? 
            // No, VerificationOracle expects bytes32. IPFS hash is usually multihash (larger).
            // We'll use keccak256 of the string.
            conditionHash = keccak256(toHex(newMilestoneCondition));
        }

        writeContract({
            address,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'addMilestones',
            args: [
                [parseEther(newMilestoneAmount)],
                [newMilestoneDesc],
                [BigInt(Math.floor(Date.now() / 1000) + 86400 * 7)], // Default 7 days
                [conditionHash as `0x${string}`]
            ]
        });
        setNewMilestoneAmount('');
        setNewMilestoneDesc('');
        setNewMilestoneCondition('');
    };

    const handleApprove = (id: number) => {
        writeContract({
            address,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'approveMilestone',
            args: [BigInt(id)]
        });
    };

    const handleRefund = (id: number) => {
        writeContract({
            address,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'refundMilestone',
            args: [BigInt(id)]
        });
    };

    const handleUpdate = (id: number) => {
        if (!updateAmount || !updateDesc) return;
        writeContract({
            address,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'updateMilestone',
            args: [
                BigInt(id),
                parseEther(updateAmount),
                updateDesc,
                BigInt(Math.floor(Date.now() / 1000) + 86400 * 7) // Keep default or existing deadline? MVP new deadline.
            ]
        });
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Payer Actions</h2>

                <div className="flex gap-4 items-center mb-6">
                    <div className="text-sm">
                        <span className="font-semibold">Total Escrow Value:</span> {formatEther(totalAmount)} ETH
                    </div>
                    {pendingAmount > 0n && (
                        <Button onClick={handleFundPending} disabled={isPending || isConfirming}>
                            Fund Pending ({formatEther(pendingAmount)} ETH)
                        </Button>
                    )}
                </div>

                {/* Add Milestone Form */}
                {milestones.every(m => m.status === 0) && pendingAmount > 0n ? (
                    // If funded (partially or fully), disable adding? 
                    // Contract says: require(totalFunded == 0). So only show if totalFunded is 0.
                    // We don't have totalFunded in props yet.
                    // For now, let's assume if user can interact, they might try.
                    <div className="p-4 border rounded bg-gray-50">
                        <h3 className="font-medium mb-2">Add Milestone (Only before funding)</h3>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Description"
                                value={newMilestoneDesc}
                                onChange={e => setNewMilestoneDesc(e.target.value)}
                            />
                            <Input
                                placeholder="Amount (ETH)"
                                type="number"
                                value={newMilestoneAmount}
                                onChange={e => setNewMilestoneAmount(e.target.value)}
                                className="w-32"
                            />
                            <Input
                                placeholder="Verification Condition (Optional)"
                                value={newMilestoneCondition}
                                onChange={e => setNewMilestoneCondition(e.target.value)}
                            />
                            <Button onClick={handleAddMilestone} disabled={isPending}>Add</Button>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Milestones</h3>
                {milestones.map((m) => (
                    <div key={m.id} className="border p-4 rounded bg-white shadow-sm flex justify-between items-center">
                        <div className="flex-1">
                            {editingId === m.id ? (
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={updateDesc}
                                        onChange={e => setUpdateDesc(e.target.value)}
                                        placeholder="Description"
                                    />
                                    <Input
                                        value={updateAmount}
                                        onChange={e => setUpdateAmount(e.target.value)}
                                        placeholder="Amount"
                                        type="number"
                                        className="w-24"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="font-medium">{m.description}</div>
                                    <div className="text-sm text-gray-500">Amount: {formatEther(m.amount)} ETH</div>
                                    <div className="text-xs text-gray-400">Deadline: {new Date(Number(m.deadline) * 1000).toLocaleDateString()}</div>
                                </>
                            )}
                            <div className="mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full ${m.status === 2 ? 'bg-green-100 text-green-800' :
                                    m.status === 5 ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                    Status: {['PENDING', 'SUBMITTED', 'APPROVED', 'RELEASED', 'REFUNDED', 'DISPUTED'][m.status]}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            {editingId === m.id ? (
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleUpdate(m.id)} disabled={isPending}>Save</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                </div>
                            ) : (
                                <>
                                    {/* Edit: Only if Pending and not funded (approx check) */}
                                    {m.status === 0 && pendingAmount > 0n && (
                                        <Button size="sm" variant="outline" onClick={() => {
                                            setEditingId(m.id);
                                            setUpdateAmount(formatEther(m.amount));
                                            setUpdateDesc(m.description);
                                        }}>Edit</Button>
                                    )}

                                    {/* Approve: If Submitted (1) or Pending (0) */}
                                    {(m.status === 0 || m.status === 1) && (
                                        <Button size="sm" onClick={() => handleApprove(m.id)} disabled={isPending}>
                                            Approve & Release
                                        </Button>
                                    )}

                                    {/* Refund: If Deadline passed and not released */}
                                    {(m.status !== 3 && m.status !== 4 && Date.now() / 1000 > Number(m.deadline)) && (
                                        <Button size="sm" variant="destructive" onClick={() => handleRefund(m.id)} disabled={isPending}>
                                            Refund
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {hash && <div className="text-xs text-gray-400 text-center break-all">Last Tx: {hash}</div>}
        </div>
    );
}
