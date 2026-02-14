
'use client'

import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MILESTONE_ESCROW_ABI } from '@/lib/constants';
import { Plus, Trash2, Loader2, Check } from 'lucide-react';
import { Address } from 'viem';

interface MilestoneInput {
    description: string;
    amount: string;
    conditionHash: string;
    deadline: string;
}

export function MilestoneCreation({ escrowAddress, onSuccess }: { escrowAddress: Address, onSuccess: () => void }) {
    const [milestones, setMilestones] = useState<MilestoneInput[]>([
        { description: '', amount: '', conditionHash: '', deadline: '0' }
    ]);

    // Default 30 days from now for UI simplicity if empty
    const defaultDeadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    React.useEffect(() => {
        if (isSuccess) {
            onSuccess();
        }
    }, [isSuccess, onSuccess]);

    const addMilestone = () => {
        setMilestones([...milestones, { description: '', amount: '', conditionHash: '', deadline: '0' }]);
    };

    const removeMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const updateMilestone = (index: number, field: keyof MilestoneInput, value: string) => {
        const newMilestones = [...milestones];
        newMilestones[index][field] = value;
        setMilestones(newMilestones);
    };

    const handleSubmit = () => {
        // Prepare arrays
        const amounts = milestones.map(m => parseEther(m.amount || '0'));
        const descriptions = milestones.map(m => m.description);
        const deadlines = milestones.map(m => BigInt(m.deadline && m.deadline !== '0' ? m.deadline : defaultDeadline));
        const conditionHashes = milestones.map(m => m.conditionHash ? (m.conditionHash as `0x${string}`) : '0x0000000000000000000000000000000000000000000000000000000000000000');

        writeContract({
            address: escrowAddress,
            abi: MILESTONE_ESCROW_ABI,
            functionName: 'addMilestones',
            args: [
                amounts,
                descriptions,
                deadlines,
                conditionHashes
            ],
        });
    };

    if (isSuccess) {
        return (
            <div className="p-8 text-center text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <Check className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Milestones Added!</h3>
                <p className="text-neutral-400 mt-2">The contract is now initialized and ready for funding.</p>
                <Button onClick={onSuccess} className="mt-4" variant="outline">Refresh View</Button>
            </div>
        )
    }

    return (
        <Card className="border-neutral-800 bg-neutral-900">
            <CardHeader>
                <CardTitle>Initialize Milestones</CardTitle>
                <CardDescription>
                    This escrow has no milestones yet. Define the scope of work and payments to start.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {milestones.map((milestone, index) => (
                    <div key={index} className="flex flex-col gap-4 p-4 border border-neutral-800 rounded-lg bg-neutral-950/30">
                        <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-neutral-400">Milestone #{index + 1}</h4>
                            {milestones.length > 1 && (
                                <button onClick={() => removeMilestone(index)} className="text-neutral-500 hover:text-red-500 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-xs text-neutral-500">Description</label>
                                <Input
                                    placeholder="e.g. Design Homepage"
                                    className="bg-neutral-950 border-neutral-800"
                                    value={milestone.description}
                                    onChange={e => updateMilestone(index, 'description', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-neutral-500">Amount (ETH)</label>
                                <Input
                                    type="number"
                                    placeholder="0.5"
                                    className="bg-neutral-950 border-neutral-800"
                                    value={milestone.amount}
                                    onChange={e => updateMilestone(index, 'amount', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <Button variant="outline" onClick={addMilestone} className="w-full border-dashed border-neutral-700 hover:bg-neutral-800">
                    <Plus className="h-4 w-4 mr-2" /> Add Another Milestone
                </Button>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleSubmit}
                    disabled={isPending || isConfirming}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                    {isPending || isConfirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isPending ? 'Confirming...' : isConfirming ? 'Adding Milestones...' : 'Initialize Contract'}
                </Button>
            </CardFooter>
        </Card>
    );
}
