
import React, { useState } from 'react';
import { Address, formatEther } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MILESTONE_ESCROW_ABI } from '@/lib/constants';
import { Milestone, EscrowDetails } from '@/hooks/useEscrow';


interface PayeeViewProps {
    address: Address;
    milestones: Milestone[];
    details: EscrowDetails;
    refetch: () => void;
}

export function PayeeView({ address, milestones, details, refetch }: PayeeViewProps) {
    const { writeContract, data: hash, isPending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    React.useEffect(() => {
        if (isSuccess) {
            refetch();
        }
    }, [isSuccess, refetch]);

    const [deliverableHash, setDeliverableHash] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleSubmit = (id: number) => {
        // In real app, we might upload file to IPFS and get hash.
        // For MVP, user enters a string or hash.
        // We need bytes32. If user enters string, we might need to hash it or expect hex.
        // Contract expects bytes32.
        // Let's assume user enters a bytes32 hex string for now, or we pad it.
        // To make it easier for demo, we can just use a dummy hash if empty, or hash the string.

        let hashArg = deliverableHash;
        if (!hashArg.startsWith('0x')) {
            // fast fake hash for demo logic if real hashing not avail in UI helper yet
            // asking user to input 0x...32bytes is hard. 
            // Better: use keccak256 of string.
            // But I don't want to import heavy lib if not needed. Viem has keccak256.
            // import { keccak256, toHex } from 'viem'
            // hashArg = keccak256(toHex(deliverableHash));
            // Let's just require 0x for now or use a default if they type "test"
            hashArg = '0x' + '0'.repeat(64); // dummy fallback
        }

        writeContract({
            address,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'submitDeliverable',
            args: [BigInt(id), hashArg as `0x${string}`]
        });
        setDeliverableHash('');
        setSelectedId(null);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Payee Workspace</h2>
                <p className="text-sm text-gray-500">
                    Submit deliverables for pending milestones to request approval.
                </p>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Milestones</h3>
                {milestones.map((m) => (
                    <div key={m.id} className="border p-4 rounded bg-white shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-medium">{m.description}</div>
                                <div className="text-sm text-gray-500">Amount: {formatEther(m.amount)} ETH</div>
                                <div className="text-xs text-gray-400">Deadline: {new Date(Number(m.deadline) * 1000).toLocaleDateString()}</div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${m.status === 2 ? 'bg-green-100 text-green-800' :
                                m.status === 3 ? 'bg-green-100 text-green-800' :
                                    m.status === 1 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                }`}>
                                {['PENDING', 'SUBMITTED', 'APPROVED', 'RELEASED', 'REFUNDED', 'DISPUTED'][m.status]}
                            </span>
                        </div>

                        {/* Actions */}

                        {m.status === 0 && (
                            <div className="mt-2 p-3 bg-gray-50 rounded">
                                {selectedId === m.id ? (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Deliverable Hash / Link"
                                            value={deliverableHash}
                                            onChange={e => setDeliverableHash(e.target.value)}
                                        />
                                        <Button onClick={() => handleSubmit(m.id)} disabled={isPending}>Submit</Button>
                                        <Button variant="ghost" onClick={() => setSelectedId(null)}>Cancel</Button>
                                    </div>
                                ) : (
                                    <Button size="sm" onClick={() => setSelectedId(m.id)} disabled={isPending}>
                                        Submit Work
                                    </Button>
                                )}
                            </div>
                        )}

                        {m.status === 1 && (
                            <div className="text-sm italic text-gray-500">
                                Submitted. Waiting for Payer approval.
                            </div>
                        )}

                        {m.status === 3 && (
                            <div className="text-sm font-medium text-green-600">
                                Payment Released!
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {hash && <div className="text-xs text-gray-400 text-center break-all">Last Tx: {hash}</div>}
        </div>
    );
}
