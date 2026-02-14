
'use client'

import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/navigation';
import { parseEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FACTORY_ABI, FACTORY_ADDRESS, VERIFICATION_ORACLE_ADDRESS } from '@/lib/constants';
import { Check, ArrowRight, ArrowLeft, Loader2, Briefcase, Home, Shield } from 'lucide-react';
import { cn } from '@/lib/utils'; // Keep existing imports

type EscrowTemplate = 'freelance' | 'rental';

interface WizardState {
    template: EscrowTemplate;
    title: string;
    payee: string;
    arbiter: string;
    // Removed milestones from here
    depositAmount: string; // For Rental
    claimWindow: string; // For Rental (seconds)
    arbitrationFee: string;
    disputeWindow: string;
    automaticReleaseTime: string;
}

export function CreateEscrowWizard() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [state, setState] = useState<WizardState>({
        template: 'freelance',
        title: '',
        payee: '',
        arbiter: '',
        depositAmount: '',
        claimWindow: '604800', // 7 days
        arbitrationFee: '0.01',
        disputeWindow: '86400', // 24 hours
        automaticReleaseTime: '604800', // 7 days (Freelance only)
    });

    const { data: hash, writeContract, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // On Success, redirect to the new escrow address? 
    // Wait, the factory emits an event but we don't easily get the address in the receipt without parsing logs.
    // For MVP, redirecting to /dashboard/escrows is safest, OR we can try to parse logs if we want deep linking.
    // Let's stick to /dashboard/escrows for now as per original code.
    React.useEffect(() => {
        if (isSuccess) {
            router.push('/dashboard/escrows');
        }
    }, [isSuccess, router]);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const selectTemplate = (template: EscrowTemplate) => {
        setState(prev => ({ ...prev, template }));
        setStep(1);
    };

    const handleDeploy = () => {
        const arbiter = (state.arbiter || '0x0000000000000000000000000000000000000000') as `0x${string}`;
        const adapter = '0x0000000000000000000000000000000000000000';
        const token = '0x0000000000000000000000000000000000000000';

        if (state.template === 'freelance') {
            writeContract({
                address: FACTORY_ADDRESS as `0x${string}`,
                abi: FACTORY_ABI,
                functionName: 'createEscrow',
                args: [
                    state.payee as `0x${string}`,
                    arbiter,
                    adapter as `0x${string}`,
                    '0x0000000000000000000000000000000000000000000000000000000000000000', // detailsHash
                    VERIFICATION_ORACLE_ADDRESS as `0x${string}`,
                    {
                        arbitrationFee: parseEther(state.arbitrationFee || '0'),
                        disputeWindow: BigInt(state.disputeWindow || '0'),
                        automaticReleaseTime: BigInt(state.automaticReleaseTime || '0')
                    }
                ],
            });
        } else {
            // Rental
            writeContract({
                address: FACTORY_ADDRESS as `0x${string}`,
                abi: FACTORY_ABI,
                functionName: 'createRentalEscrow',
                args: [
                    state.payee as `0x${string}`,
                    arbiter,
                    adapter as `0x${string}`,
                    token as `0x${string}`,
                    parseEther(state.depositAmount || '0'),
                    {
                        arbitrationFee: parseEther(state.arbitrationFee || '0'),
                        disputeWindow: BigInt(state.disputeWindow || '0'),
                        claimWindow: BigInt(state.claimWindow || '0')
                    }
                ],
            });
        }
    };

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Main Wizard Area */}
            <Card className="border-neutral-800 bg-neutral-900">
                <CardHeader>
                    <CardTitle>
                        {step === 0 && "Choose your Escrow Type"}
                        {step === 1 && "Contract Configuration"}
                        {step === 2 && "Review & Deploy"}
                    </CardTitle>
                    <CardDescription>
                        {step === 0 && "Select a template that best fits your transaction."}
                        {step === 1 && "Define the parties involved and security settings."}
                        {step === 2 && "Review all details. Once deployed, you will add milestones."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === 0 && (
                        <div className="grid md:grid-cols-2 gap-4">
                            <div
                                className="cursor-pointer border border-neutral-800 rounded-lg p-6 hover:bg-neutral-800 transition-colors flex flex-col items-start gap-4"
                                onClick={() => selectTemplate('freelance')}
                            >
                                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-neutral-200">Freelance & Services</h3>
                                    <p className="text-sm text-neutral-400 mt-1">Milestone-based payments. Release funds as work is completed.</p>
                                </div>
                            </div>
                            <div
                                className="cursor-pointer border border-neutral-800 rounded-lg p-6 hover:bg-neutral-800 transition-colors flex flex-col items-start gap-4"
                                onClick={() => selectTemplate('rental')}
                            >
                                <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                                    <Home className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-neutral-200">Rental Deposit</h3>
                                    <p className="text-sm text-neutral-400 mt-1">Hold security deposits. Landlords request deductions, tenants can dispute.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">
                                    {state.template === 'rental' ? 'Property / Agreement Title' : 'Project Title'}
                                </label>
                                <Input
                                    placeholder={state.template === 'rental' ? "e.g. 123 Main St, Apt 4B" : "e.g. Website Redesign"}
                                    className="bg-neutral-950 border-neutral-800"
                                    value={state.title}
                                    onChange={e => setState({ ...state, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">
                                        {state.template === 'rental' ? 'Landlord (Payee)' : 'Service Provider (Payee)'}
                                    </label>
                                    <Input
                                        placeholder="Wallet address or ENS"
                                        className="bg-neutral-950 border-neutral-800"
                                        value={state.payee}
                                        onChange={e => setState({ ...state, payee: e.target.value })}
                                    />
                                    <p className="text-xs text-neutral-500">
                                        The person who will receive the funds.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Referee (Arbiter)</label>
                                    <Input
                                        placeholder="Neutral third party address"
                                        className="bg-neutral-950 border-neutral-800"
                                        value={state.arbiter}
                                        onChange={e => setState({ ...state, arbiter: e.target.value })}
                                    />
                                    <p className="text-xs text-neutral-500">Optional. Required to resolve disputes.</p>
                                </div>
                            </div>

                            {state.template === 'rental' && (
                                <div className="space-y-4 pt-4 border-t border-neutral-800">
                                    <h3 className="text-sm font-medium text-neutral-200">Deposit Settings</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-neutral-300">Deposit Amount (ETH)</label>
                                            <Input
                                                placeholder="e.g. 1.5"
                                                type="number"
                                                className="bg-neutral-950 border-neutral-800"
                                                value={state.depositAmount}
                                                onChange={e => setState({ ...state, depositAmount: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-neutral-300">Claim Window (Seconds)</label>
                                            <Input
                                                placeholder="e.g. 604800"
                                                type="number"
                                                className="bg-neutral-950 border-neutral-800"
                                                value={state.claimWindow}
                                                onChange={e => setState({ ...state, claimWindow: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-400">Template</span>
                                    <Badge variant="outline" className="capitalize border-neutral-700 text-neutral-300">{state.template}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-400">Project</span>
                                    <span className="font-medium text-neutral-200">{state.title}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-400">Payee</span>
                                    <span className="font-mono text-xs text-neutral-200">{state.payee}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-400">Arbiter</span>
                                    <span className="font-mono text-xs text-neutral-200">{state.arbiter || 'None'}</span>
                                </div>

                                {state.template === 'rental' && (
                                    <>
                                        <Separator className="bg-neutral-800" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-neutral-400">Deposit</span>
                                            <span className="font-mono text-neutral-200">{state.depositAmount} ETH</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {state.template === 'freelance' && (
                                <div className="p-3 bg-blue-900/10 border border-blue-900/30 text-blue-400 rounded text-sm text-center">
                                    You will add milestones <strong>after</strong> deploying the contract.
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-500 rounded text-sm text-center">
                                    {(error as any).shortMessage || error.message}
                                </div>
                            )}

                            {hash && (
                                <div className="text-center text-xs text-neutral-500 mt-2">
                                    Transaction sent: {hash.slice(0, 10)}...{hash.slice(-8)}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                    {step > 0 && (
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={isPending || isConfirming}
                            className="text-neutral-400 hover:text-neutral-50"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    )}

                    {step === 0 && <div />}

                    {step < 2 ? (
                        step === 0 ? null : (
                            <Button
                                onClick={handleNext}
                                disabled={!state.payee}
                                className="bg-neutral-50 text-neutral-900 hover:bg-neutral-200"
                            >
                                Next Step <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )
                    ) : (
                        <Button
                            onClick={handleDeploy}
                            disabled={isPending || isConfirming}
                            className="bg-emerald-500 text-white hover:bg-emerald-600"
                        >
                            {isPending || isConfirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            {isPending ? 'Confirming...' : isConfirming ? 'Deploying...' : 'Deploy Contract'}
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Sidebar Info */}
            <div className="space-y-6 hidden lg:block">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-colors", step >= 0 ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-neutral-800 bg-neutral-900")}>
                            0
                        </div>
                        <span className={step >= 0 ? "text-neutral-200" : ""}>Template</span>
                    </div>
                    <div className="h-8 w-[1px] bg-neutral-800 ml-4"></div>
                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-colors", step >= 1 ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-neutral-800 bg-neutral-900")}>
                            1
                        </div>
                        <span className={step >= 1 ? "text-neutral-200" : ""}>Configuration</span>
                    </div>
                    <div className="h-8 w-[1px] bg-neutral-800 ml-4"></div>
                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-colors", step >= 2 ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-neutral-800 bg-neutral-900")}>
                            2
                        </div>
                        <span className={step >= 2 ? "text-neutral-200" : ""}>Deploy</span>
                    </div>
                </div>

                <Card className="bg-neutral-900/50 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4 text-emerald-500" />
                            Guide
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-neutral-500 space-y-2">
                        {step === 0 && <p>Select the type of escrow you need.</p>}
                        {step === 1 && <p>Enter the wallet address of who you are paying (Payee) and an optional neutral Arbiter.</p>}
                        {step === 2 && <p>Once you deploy, you will be taken to the dashboard to <strong>add payment milestones</strong>.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
