'use client'

import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FACTORY_ADDRESS, FACTORY_ABI } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export default function CreateEscrow() {
    const router = useRouter();
    const [payee, setPayee] = useState('');
    const [arbiter, setArbiter] = useState('');
    const { data: hash, writeContract, isPending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const handleDeploy = async () => {
        if (!payee) return;

        writeContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'createEscrow',
            args: [
                payee as `0x${string}`,
                (arbiter || '0x0000000000000000000000000000000000000000') as `0x${string}`,
                '0x0000000000000000000000000000000000000000', // No adapter for MVP default
                '0x0000000000000000000000000000000000000000000000000000000000000000' // empty hash
            ],
        });
    };

    React.useEffect(() => {
        if (isSuccess) {
            // Redirect to dashboard or detail page (Need to parse logs to retrieve address in real app)
            // For now just back to home
            router.push('/');
        }
    }, [isSuccess, router]);

    return (
        <div className="container mx-auto max-w-2xl py-20">
            <h1 className="text-3xl font-bold mb-8">Create New Escrow</h1>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2">Payee Address</label>
                    <Input placeholder="0x..." value={payee} onChange={(e) => setPayee(e.target.value)} />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Arbiter Address (Optional)</label>
                    <Input placeholder="0x..." value={arbiter} onChange={(e) => setArbiter(e.target.value)} />
                </div>

                <Button
                    className="w-full"
                    onClick={handleDeploy}
                    disabled={!payee || isPending || isConfirming}
                >
                    {isPending || isConfirming ? 'Deploying...' : 'Deploy Escrow Contract'}
                </Button>

                {hash && <div className="text-sm text-gray-500 mt-2">Tx Hash: {hash}</div>}
            </div>
        </div>
    );
}
