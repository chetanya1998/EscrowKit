
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
import { FACTORY_ABI, FACTORY_ADDRESS, SIMPLE_ARBITER_ADAPTER_ADDRESS, VERIFICATION_ORACLE_ADDRESS } from '@/lib/constants';
import { Check, User, Shield, Wallet, Plus, Trash2, ArrowRight, ArrowLeft, Loader2, Briefcase, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

type EscrowTemplate = 'freelance' | 'rental';

interface MilestoneInput {
    description: string;

    amount: string;
    condition: string;
}

interface WizardState {
    template: EscrowTemplate;
    title: string;
    payee: string;
    arbiter: string;
    milestones: MilestoneInput[]; // For Freelance
    depositAmount: string; // For Rental
    claimWindow: string; // For Rental (seconds)
    arbitrationFee: string;
    disputeWindow: string;
    automaticReleaseTime: string;
}

export function CreateEscrowWizard() {
    const router = useRouter();
    const [step, setStep] = useState(0); // Step 0 is Template Selection
    const [state, setState] = useState<WizardState>({
        template: 'freelance',
        title: '',
        payee: '',
        arbiter: '',
        milestones: [{ description: '', amount: '', condition: '' }],
        depositAmount: '',
        claimWindow: '604800', // 7 days default
        arbitrationFee: '0.01',
        disputeWindow: '86400', // 24 hours
        automaticReleaseTime: '604800', // 7 days (Freelance only)
    });

    const { data: hash, writeContract, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

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

    const addMilestone = () => {
        setState(prev => ({
            ...prev,
            milestones: [...prev.milestones, { description: '', amount: '', condition: '' }]
        }));
    };

    const removeMilestone = (index: number) => {
        setState(prev => ({
            ...prev,
            milestones: prev.milestones.filter((_, i) => i !== index)
        }));
    };

    const updateMilestone = (index: number, field: keyof MilestoneInput, value: string) => {
        const newMilestones = [...state.milestones];
        newMilestones[index][field] = value;
        setState({ ...state, milestones: newMilestones });
    };

    const handleDeploy = () => {
        const arbiter = (state.arbiter || '0x0000000000000000000000000000000000000000') as `0x${string}`;
        const adapter = '0x0000000000000000000000000000000000000000'; // Default simple arbiter for now, or fetch from config
        const token = '0x0000000000000000000000000000000000000000'; // Native ETH for MVP

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
                    VERIFICATION_ORACLE_ADDRESS as `0x${string}`, // verificationOracle
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

    const totalAmount = state.template === 'freelance'
        ? state.milestones.reduce((acc, m) => acc + Number(m.amount || 0), 0)
        : Number(state.depositAmount || 0);

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Main Wizard Area */}
            <Card className="border-neutral-800 bg-neutral-900">
                <CardHeader>
                    <CardTitle>
                        {step === 0 && "Choose your Escrow Type"}
                        {step === 1 && "Who are you working with?"}
                        {step === 2 && (state.template === 'freelance' ? "Break down the work" : "Set Deposit Terms")}
                        {step === 3 && "Security Check"}
                    </CardTitle>
                    <CardDescription>
                        {step === 0 && "Select a template that best fits your transaction."}
                        {step === 1 && "Define the project title and key people involved."}
                        {step === 2 && (state.template === 'freelance' ? "Create milestone steps. Funds are released step-by-step." : "Define the security deposit amount and claim period.")}
                        {step === 3 && "Review all details before deploying the contract."}
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
                                        {state.template === 'rental' ? 'Landlord (Payee)' : 'Service Provider'}
                                    </label>
                                    <Input
                                        placeholder="Wallet address or ENS"
                                        className="bg-neutral-950 border-neutral-800"
                                        value={state.payee}
                                        onChange={e => setState({ ...state, payee: e.target.value })}
                                    />
                                    <p className="text-xs text-neutral-500">
                                        {state.template === 'rental' ? 'The landlord who receives claimed funds.' : 'The person or company who will get paid.'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Referee (Arbiter)</label>
                                    <Input
                                        placeholder="Neutral third party"
                                        className="bg-neutral-950 border-neutral-800"
                                        value={state.arbiter}
                                        onChange={e => setState({ ...state, arbiter: e.target.value })}
                                    />
                                    <p className="text-xs text-neutral-500">Optional. They resolve disputes if needed.</p>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && state.template === 'freelance' && (
                        <div className="space-y-4">
                            {state.milestones.map((milestone, index) => (
                                <div key={index} className="flex gap-4 items-start">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs font-medium text-neutral-500">Step Description</label>
                                        <Input
                                            placeholder="e.g. Design Prototype"
                                            className="bg-neutral-950 border-neutral-800"
                                            value={milestone.description}
                                            onChange={e => updateMilestone(index, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-32 space-y-2">
                                        <label className="text-xs font-medium text-neutral-500">Amount (ETH)</label>
                                        <Input
                                            placeholder="0.00"
                                            type="number"
                                            className="bg-neutral-950 border-neutral-800"
                                            value={milestone.amount}
                                            onChange={e => updateMilestone(index, 'amount', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs font-medium text-neutral-500">Condition (Optional)</label>
                                        <Input
                                            placeholder="Verification details..."
                                            className="bg-neutral-950 border-neutral-800"
                                            value={milestone.condition}
                                            onChange={e => updateMilestone(index, 'condition', e.target.value)}
                                        />
                                    </div>
                                    <div className="pt-8">
                                        <Button variant="ghost" size="icon" onClick={() => removeMilestone(index)} disabled={state.milestones.length === 1}>
                                            <Trash2 className="h-4 w-4 text-neutral-500 hover:text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" onClick={addMilestone} className="w-full border-dashed border-neutral-700 hover:bg-neutral-800">
                                <Plus className="h-4 w-4 mr-2" /> Add Another Step
                            </Button>
                        </div>
                    )}

                    {step === 2 && state.template === 'rental' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Security Deposit Amount (ETH)</label>
                                <Input
                                    placeholder="e.g. 1.5"
                                    type="number"
                                    className="bg-neutral-950 border-neutral-800 text-lg"
                                    value={state.depositAmount}
                                    onChange={e => setState({ ...state, depositAmount: e.target.value })}
                                />
                                <p className="text-xs text-neutral-500">This amount will be locked in the contract.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Claim Window (Seconds)</label>
                                <Input
                                    placeholder="e.g. 604800 (7 days)"
                                    type="number"
                                    className="bg-neutral-950 border-neutral-800"
                                    value={state.claimWindow}
                                    onChange={e => setState({ ...state, claimWindow: e.target.value })}
                                />
                                <p className="text-xs text-neutral-500">How long the tenant has to dispute a claim from the landlord.</p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
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
                                <Separator className="bg-neutral-800" />

                                {state.template === 'freelance' ? (
                                    <div className="space-y-2">
                                        {state.milestones.map((m, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <span className="text-neutral-400">{i + 1}. {m.description}</span>
                                                <span className="text-neutral-200">{m.amount} ETH</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-neutral-400">Deposit Amount</span>
                                            <span className="text-neutral-200">{state.depositAmount} ETH</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-neutral-400">Claim Window</span>
                                            <span className="text-neutral-200">{state.claimWindow} seconds</span>
                                        </div>
                                    </div>
                                )}

                                <Separator className="bg-neutral-800" />
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-sm font-medium text-emerald-500">Total Value</span>
                                    <span className="font-bold text-lg text-emerald-400">{totalAmount} ETH</span>
                                </div>
                            </div>

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

                    {step === 0 && <div />} {/* Spacer */}

                    {step < 3 ? (
                        step === 0 ? null : ( // Handled by template selection click
                            <Button
                                onClick={handleNext}
                                disabled={!state.payee} // Basic validation
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
                        <span className={step >= 1 ? "text-neutral-200" : ""}>Participants</span>
                    </div>
                    <div className="h-8 w-[1px] bg-neutral-800 ml-4"></div>
                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-colors", step >= 2 ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-neutral-800 bg-neutral-900")}>
                            2
                        </div>
                        <span className={step >= 2 ? "text-neutral-200" : ""}>Terms</span>
                    </div>
                    <div className="h-8 w-[1px] bg-neutral-800 ml-4"></div>
                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-colors", step >= 3 ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-neutral-800 bg-neutral-900")}>
                            3
                        </div>
                        <span className={step >= 3 ? "text-neutral-200" : ""}>Review</span>
                    </div>
                </div>

                <Card className="bg-neutral-900/50 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4 text-emerald-500" />
                            Why This Matters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-neutral-500 space-y-2">
                        {step === 0 && <p>Different escrow types handle funds differently. Freelance escrows release funds in stages, while Rental escrows hold a deposit until the end of the term.</p>}
                        {step === 1 && <p>Defining a Referee ensures that if there is a disagreement, a neutral third party can help reach a fair decision.</p>}
                        {step === 2 && state.template === 'freelance' && <p>Breaking a project into milestones builds trust. The worker sees the funds are safe, and you only release them when you're happy.</p>}
                        {step === 2 && state.template === 'rental' && <p>The deposit claim window gives the tenant time to dispute any deductions the landlord tries to make.</p>}
                        {step === 3 && <p>Once deployed, the terms are immutable on the blockchain. Ensure all addresses and amounts are correct.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
