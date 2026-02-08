
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Milestone } from '@/hooks/useEscrow';
import { formatEther } from 'viem';

interface MilestoneListProps {
    milestones: Milestone[];
    onAction?: (action: string, id: number, data?: any) => void;
    userRole?: 'payer' | 'payee' | 'arbiter' | 'viewer';
}

export function MilestoneList({ milestones, onAction, userRole = 'viewer' }: MilestoneListProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Milestones</h3>
            {milestones.map((m) => (
                <div key={m.id} className="border p-4 rounded bg-white shadow-sm flex justify-between items-center">
                    <div>
                        <div className="font-medium">{m.description}</div>
                        <div className="text-sm text-gray-500">Amount: {formatEther(m.amount)} ETH</div>
                        <div className="text-xs text-gray-400">Deadline: {new Date(Number(m.deadline) * 1000).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${m.status === 2 || m.status === 3 ? 'bg-green-100 text-green-800' :
                            m.status === 5 ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                        }`}>
                        {['PENDING', 'SUBMITTED', 'APPROVED', 'RELEASED', 'REFUNDED', 'DISPUTED'][m.status]}
                    </span>
                </div>
            ))}
            {milestones.length === 0 && <div className="text-gray-500 italic">No milestones yet.</div>}
        </div>
    );
}
