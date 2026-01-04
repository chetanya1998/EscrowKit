'use client'

import React from 'react';
import { useParams } from 'next/navigation';
import { useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FACTORY_ABI } from '@/lib/constants';

// Minimal ABI for MilestoneEscrow
const ESCROW_ABI = [
    {
        "type": "function",
        "name": "fund",
        "inputs": [],
        "outputs": [],
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "addMilestones",
        "inputs": [
            { "name": "amounts", "type": "uint256[]" },
            { "name": "descriptions", "type": "string[]" },
            { "name": "deadlines", "type": "uint256[]" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "getMilestoneCount",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "payer",
        "inputs": [],
        "outputs": [{ "name": "", "type": "address" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "payee",
        "inputs": [],
        "outputs": [{ "name": "", "type": "address" }],
        "stateMutability": "view"
    }
] as const;

export default function EscrowDetail() {
    const params = useParams();
    const address = params.address as `0x${string}`;

    const { data: payer } = useReadContract({
        address,
        abi: ESCROW_ABI,
        functionName: 'payer',
    });

    const { data: payee } = useReadContract({
        address,
        abi: ESCROW_ABI,
        functionName: 'payee',
    });

    const { writeContract } = useWriteContract();

    const handleFund = () => {
        // Hardcoded 5 ETH fund for MVP demo
        writeContract({
            address,
            abi: ESCROW_ABI,
            functionName: 'fund',
            value: parseEther('5')
        })
    }

    const handleAddMilestones = () => {
        // Hardcoded milestones for MVP demo
        writeContract({
            address,
            abi: ESCROW_ABI,
            functionName: 'addMilestones',
            args: [
                [parseEther('2'), parseEther('3')],
                ["Milestone 1: Prototype", "Milestone 2: Final Release"],
                [BigInt(Math.floor(Date.now() / 1000) + 86400), BigInt(Math.floor(Date.now() / 1000) + 172800)]
            ]
        })
    }

    return (
        <div className="container mx-auto max-w-4xl py-20">
            <h1 className="text-3xl font-bold mb-8">Escrow: {address}</h1>

            <div className="grid gap-6 border p-6 rounded-lg mb-8">
                <div><strong>Payer:</strong> {payer}</div>
                <div><strong>Payee:</strong> {payee}</div>
            </div>

            <div className="flex gap-4">
                <Button onClick={handleAddMilestones}>Add Milestones (Demo)</Button>
                <Button onClick={handleFund}>Fund All (Demo 5 ETH)</Button>
            </div>

            <div className="mt-8 p-4 bg-gray-100 rounded">
                <p className="text-sm text-gray-500">
                    * In a full implementation, this page would fetch milestones from the API/Indexer and list them with actions (Submit, Approve, Release).
                    For this MVP scaffold, use the buttons above to trigger on-chain actions and check console/events.
                </p>
            </div>
        </div>
    );
}
