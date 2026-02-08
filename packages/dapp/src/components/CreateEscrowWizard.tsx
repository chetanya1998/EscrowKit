'use client'

import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/navigation';
import { parseEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FACTORY_ADDRESS, FACTORY_ABI } from '@/lib/constants';

interface WizardState {
    payee: string;
    arbiter: string;
    arbitrationFee: string; // in ETH
    disputeWindow: string; // in seconds
    automaticReleaseTime: string; // in seconds
}

export function CreateEscrowWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [state, setState] = useState<WizardState>({
        payee: '',
        arbiter: '',
        arbitrationFee: '0.01',
        disputeWindow: '86400', // 1 day
        automaticReleaseTime: '604800', // 1 week
    });

    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    React.useEffect(() => {
        if (isSuccess) {
            // Ideally navigate to the new escrow. For now, go home or show success.
            // In a real app we'd parse logs to get the address.
            router.push('/');
        }
    }, [isSuccess, router]);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleDeploy = () => {
        try {
            writeContract({
                address: FACTORY_ADDRESS as `0x${string}`,
                abi: FACTORY_ABI,
                functionName: 'createEscrow',
                args: [
                    state.payee as `0x${string}`,
                    (state.arbiter || '0x0000000000000000000000000000000000000000') as `0x${string}`,
                    '0x0000000000000000000000000000000000000000', // Adapter (default 0 for MVP)
                    '0x0000000000000000000000000000000000000000000000000000000000000000', // Details hash
                    {
                        arbitrationFee: parseEther(state.arbitrationFee || '0'),
                        disputeWindow: BigInt(state.disputeWindow || '0'),
                        automaticReleaseTime: BigInt(state.automaticReleaseTime || '0')
                    }
                ],
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold">Create Escrow - Step {step} of 3</h2>
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-2 w-8 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    ))}
                </div>
            </div>

            {step === 1 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Participants</h3>
                    <div>
                        <label className="block text-sm font-medium mb-1">Payee Address</label>
                        <Input
                            placeholder="0x..."
                            value={state.payee}
                            onChange={(e) => setState({ ...state, payee: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">The address receiving the funds.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Arbiter Address (Optional)</label>
                        <Input
                            placeholder="0x..."
                            value={state.arbiter}
                            onChange={(e) => setState({ ...state, arbiter: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Trusted third party to resolve disputes.</p>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Terms & Configuration</h3>
                    <div>
                        <label className="block text-sm font-medium mb-1">Arbitration Fee (ETH)</label>
                        <Input
                            type="number"
                            placeholder="0.01"
                            value={state.arbitrationFee}
                            onChange={(e) => setState({ ...state, arbitrationFee: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Dispute Window (Seconds)</label>
                        <Input
                            type="number"
                            value={state.disputeWindow}
                            onChange={(e) => setState({ ...state, disputeWindow: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Time allowed for dispute resolution (default 1 day = 86400s).</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Automatic Release Time (Seconds)</label>
                        <Input
                            type="number"
                            value={state.automaticReleaseTime}
                            onChange={(e) => setState({ ...state, automaticReleaseTime: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Time until funds auto-release if no dispute (default 1 week = 604800s).</p>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Review</h3>
                    <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                        <p><strong>Payee:</strong> {state.payee || 'Not Set'}</p>
                        <p><strong>Arbiter:</strong> {state.arbiter || 'None'}</p>
                        <p><strong>Arbitration Fee:</strong> {state.arbitrationFee} ETH</p>
                        <p><strong>Dispute Window:</strong> {state.disputeWindow} seconds</p>
                        <p><strong>Auto Release:</strong> {state.automaticReleaseTime} seconds</p>
                    </div>
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded text-sm">
                            {(error as any).shortMessage || error.message}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 flex justify-between">
                {step > 1 ? (
                    <Button variant="outline" onClick={handleBack} disabled={isPending || isConfirming}>Back</Button>
                ) : (
                    <div />
                )}

                {step < 3 ? (
                    <Button onClick={handleNext} disabled={!state.payee}>Next</Button>
                ) : (
                    <Button onClick={handleDeploy} disabled={!state.payee || isPending || isConfirming}>
                        {isPending ? 'Confirming...' : isConfirming ? 'Deploying...' : 'Deploy Contract'}
                    </Button>
                )}
            </div>
            {hash && <div className="text-xs text-gray-400 mt-4 text-center break-all">Tx: {hash}</div>}
        </div>
    );
}
