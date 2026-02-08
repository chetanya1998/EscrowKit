
import React from 'react';
import { EscrowDetails } from '@/hooks/useEscrow';
import { formatEther } from 'viem';

interface EscrowInfoProps {
    details: EscrowDetails;
    address: string;
}

export function EscrowInfo({ details, address }: EscrowInfoProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h1 className="text-2xl font-bold mb-4">Escrow Contract</h1>
            <div className="text-sm text-gray-500 mb-6 font-mono break-all">{address}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Participants</h3>
                    <div className="space-y-2">
                        <div>
                            <span className="text-gray-600 w-20 inline-block">Payer:</span>
                            <span className="font-mono text-sm">{details.payer}</span>
                        </div>
                        <div>
                            <span className="text-gray-600 w-20 inline-block">Payee:</span>
                            <span className="font-mono text-sm">{details.payee}</span>
                        </div>
                        <div>
                            <span className="text-gray-600 w-20 inline-block">Arbiter:</span>
                            <span className="font-mono text-sm">{details.arbiter === '0x0000000000000000000000000000000000000000' ? 'None' : details.arbiter}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Configuration</h3>
                    <div className="space-y-2">
                        <div>
                            <span className="text-gray-600 inline-block mr-2">Arb Fee:</span>
                            <span>{details.config ? formatEther(details.config.arbitrationFee) : '0'} ETH</span>
                        </div>
                        <div>
                            <span className="text-gray-600 inline-block mr-2">Dispute Window:</span>
                            <span>{details.config ? Number(details.config.disputeWindow) / 3600 : 0} Hours</span>
                        </div>
                        <div>
                            <span className="text-gray-600 inline-block mr-2">Token:</span>
                            <span className="font-mono text-sm">{details.token === '0x0000000000000000000000000000000000000000' ? 'ETH' : details.token}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
