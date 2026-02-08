'use client'

import React from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { useEscrow } from '@/hooks/useEscrow';
import { EscrowInfo } from '@/components/escrow/EscrowInfo';
import { PayerView } from '@/components/escrow/PayerView';
import { PayeeView } from '@/components/escrow/PayeeView';
import { MilestoneList } from '@/components/escrow/MilestoneList';

export default function EscrowDetail() {
    const params = useParams();
    const address = params.address as Address;
    const { address: userAddress } = useAccount();

    const { milestones, details, isLoading, refetch } = useEscrow(address);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading escrow details...</div>
            </div>
        );
    }

    if (!details) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-red-500">Failed to load escrow details. Check chain connection.</div>
            </div>
        );
    }

    const isPayer = userAddress && details.payer.toLowerCase() === userAddress.toLowerCase();
    const isPayee = userAddress && details.payee.toLowerCase() === userAddress.toLowerCase();

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto max-w-4xl py-10 px-4">
                <EscrowInfo details={details} address={address} />

                {isPayer ? (
                    <PayerView
                        address={address}
                        milestones={milestones}
                        details={details}
                        refetch={refetch}
                    />
                ) : isPayee ? (
                    <PayeeView
                        address={address}
                        milestones={milestones}
                        details={details}
                        refetch={refetch}
                    />
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <MilestoneList milestones={milestones} userRole="viewer" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
