"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, PenLine, FileText, Link as LinkIcon, Lock } from "lucide-react";
import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import EscrowFactoryABI from "@/lib/EscrowFactory.json";

// Standard supported tokens (Base Sepolia for example)
const SUPPORTED_TOKENS = [
    { symbol: 'USDC', address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 },
    { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    { symbol: 'DEV', address: '0x9999999999999999999999999999999999999999', decimals: 18 } // Placeholder
];

export default function CustomEscrowPage() {
    const { address, isConnected } = useAccount();
    const [step, setStep] = useState(1);

    // Form State
    const [taskDescription, setTaskDescription] = useState("");
    const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
    const [totalAmount, setTotalAmount] = useState<string>("");

    type Milestone = { percentage: number; description: string; proofType: string; customProof: string };
    const [milestones, setMilestones] = useState<Milestone[]>([
        { percentage: 100, description: "Final Delivery", proofType: "github", customProof: "" }
    ]);

    const [payeeAddress, setPayeeAddress] = useState("");
    const [arbiterAddress, setArbiterAddress] = useState("0x0000000000000000000000000000000000000000"); // Default Arbiter
    const [arbitrationAdapter, setArbitrationAdapter] = useState("0x0000000000000000000000000000000000000000"); // Default Adapter
    const [verificationOracle, setVerificationOracle] = useState("0x0000000000000000000000000000000000000000"); // Default Oracle

    // Penalties & Fees (BPS: 100 = 1%)
    const [arbitrationFeeBps, setArbitrationFeeBps] = useState(500); // 5%
    const [payerPenaltyBps, setPayerPenaltyBps] = useState(100);     // 1% per day
    const [payeePenaltyBps, setPayeePenaltyBps] = useState(100);     // 1% per day
    const [disputeWindow, setDisputeWindow] = useState(14);          // 14 days
    const [reviewPeriod, setReviewPeriod] = useState(7);             // 7 days

    const [deployedEscrowHash, setDeployedEscrowHash] = useState<string | null>(null);

    // Contract Interaction
    const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;
    const { data: hash, writeContract, isPending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const addMilestone = () => {
        setMilestones([...milestones, { percentage: 0, description: "", proofType: "github", customProof: "" }]);
    };

    const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
        const newMilestones = [...milestones];
        newMilestones[index] = { ...newMilestones[index], [field]: value };
        setMilestones(newMilestones);
    };

    const removeMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const totalPercentage = milestones.reduce((sum, m) => sum + Number(m.percentage), 0);

    const handleDeploy = async () => {
        if (!isConnected || !address) return alert("Please connect your wallet first.");

        try {
            const amountList = milestones.map(m => {
                const amountForMilestone = (Number(totalAmount) * (m.percentage / 100)).toString();
                return parseUnits(amountForMilestone, selectedToken.decimals);
            });
            const descriptionList = milestones.map(m => m.description);
            const deadlineList = milestones.map(() => BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60)); // Placeholder 30 days
            const conditionHashList = milestones.map(() => "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`);

            const config = {
                arbitrationFeeBps: BigInt(arbitrationFeeBps),
                payerPenaltyBps: BigInt(payerPenaltyBps),
                payeePenaltyBps: BigInt(payeePenaltyBps),
                disputeWindow: BigInt(disputeWindow * 24 * 60 * 60),
                reviewPeriod: BigInt(reviewPeriod * 24 * 60 * 60)
            };

            writeContract({
                address: factoryAddress,
                abi: EscrowFactoryABI.abi,
                functionName: 'createEscrow',
                args: [
                    payeeAddress,        // payee
                    arbiterAddress,      // arbiter
                    arbitrationAdapter,  // arbitrationAdapter
                    "0x0000000000000000000000000000000000000000000000000000000000000000", // detailsHash
                    verificationOracle,  // verificationOracle
                    config,              // EscrowConfig
                    amountList,          // amounts
                    descriptionList,     // descriptions
                    deadlineList,        // deadlines
                    conditionHashList    // conditionHashes
                ],
                value: selectedToken.address === "0x0000000000000000000000000000000000000000" ? parseUnits(totalAmount, 18) : 0n
            });
        } catch (err: any) {
            console.error(err);
            alert("Failed to deploy: " + err.message);
        }
    };

    // If successfully deployed
    if (isConfirmed || deployedEscrowHash) {
        return (
            <div className="min-h-screen bg-black text-white p-6 md:p-12 flex items-center justify-center">
                <div className="max-w-md w-full border border-zinc-800 bg-zinc-950 p-8 rounded-2xl text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Escrow Created Successfully!</h2>
                        <p className="text-zinc-400 text-sm">
                            Your smart contract escrow has been deployed to the blockchain. The funds are securely locked and waiting for milestone completion.
                        </p>
                    </div>

                    <div className="bg-black border border-zinc-800 p-4 rounded-lg break-all text-xs font-mono text-emerald-500/80">
                        {hash || deployedEscrowHash}
                    </div>

                    <Link href="/dashboard" className="block w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3 px-6 rounded-xl transition-all">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto mt-8 relative z-10">
                <Link href="/dashboard/templates" className="text-zinc-500 hover:text-white flex items-center gap-2 mb-8 transition-colors w-fit">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Templates
                </Link>

                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-zinc-500 text-transparent bg-clip-text mb-8">
                    Custom Escrow Builder
                </h1>

                {/* Stepper */}
                <div className="flex items-center gap-2 mb-12 overflow-x-auto pb-4">
                    {[
                        { num: 1, label: "Scope & Terms" },
                        { num: 2, label: "Milestones" },
                        { num: 3, label: "Penalties" },
                        { num: 4, label: "Review" }
                    ].map((s) => (
                        <div key={s.num} className="flex items-center gap-2 shrink-0">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step === s.num ? 'bg-emerald-500 text-black' : step > s.num ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                                {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                            </div>
                            <span className={`text-sm font-medium ${step >= s.num ? 'text-white' : 'text-zinc-600'}`}>{s.label}</span>
                            {s.num < 4 && <div className="h-px w-8 bg-zinc-800 mx-2" />}
                        </div>
                    ))}
                </div>

                <div className="border border-zinc-800 bg-zinc-950/50 rounded-2xl p-6 md:p-8">

                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-semibold border-b border-zinc-800 pb-4">Step 1: Task Scope & Currency</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Complete Task Description</label>
                                    <textarea
                                        value={taskDescription}
                                        onChange={e => setTaskDescription(e.target.value)}
                                        placeholder="Describe exactly what needs to be built/delivered..."
                                        className="w-full h-32 bg-black border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Currency</label>
                                        <select
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                                            value={selectedToken.address}
                                            onChange={(e) => setSelectedToken(SUPPORTED_TOKENS.find(t => t.address === e.target.value) || SUPPORTED_TOKENS[0])}
                                        >
                                            {SUPPORTED_TOKENS.map(t => (
                                                <option key={t.address} value={t.address}>{t.symbol}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Total Amount ({selectedToken.symbol})</label>
                                        <input
                                            type="number"
                                            value={totalAmount}
                                            onChange={e => setTotalAmount(e.target.value)}
                                            placeholder="e.g. 1500"
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!taskDescription || !totalAmount}
                                    className="bg-white hover:bg-zinc-200 text-black font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    Continue to Milestones <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-between border-b border-zinc-800 pb-4">
                                <h2 className="text-xl font-semibold">Step 2: Milestone Breakdown</h2>
                                <span className={`text-sm font-medium ${totalPercentage === 100 ? 'text-emerald-500' : 'text-red-400'}`}>
                                    Total: {totalPercentage}% / 100%
                                </span>
                            </div>

                            <div className="space-y-4">
                                {milestones.map((milestone, idx) => (
                                    <div key={idx} className="bg-black border border-zinc-800 rounded-xl p-4 md:p-6 space-y-4 focus-within:border-emerald-500/30 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-medium text-zinc-300">Milestone {idx + 1}</h3>
                                            {milestones.length > 1 && (
                                                <button onClick={() => removeMilestone(idx)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-1">
                                                <label className="block text-xs font-medium text-zinc-500 mb-1">Percentage (%)</label>
                                                <input
                                                    type="number" max="100" min="1"
                                                    value={milestone.percentage}
                                                    onChange={e => updateMilestone(idx, 'percentage', e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500/50"
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-medium text-zinc-500 mb-1">Deliverable / Description</label>
                                                <input
                                                    type="text"
                                                    value={milestone.description}
                                                    onChange={e => updateMilestone(idx, 'description', e.target.value)}
                                                    placeholder="e.g. Frontend Design Approval"
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-900 pt-4">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 mb-1">Kind of Proof Required</label>
                                                <select
                                                    value={milestone.proofType}
                                                    onChange={e => updateMilestone(idx, 'proofType', e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                                                >
                                                    <option value="github">GitHub PR / Repo Link</option>
                                                    <option value="figma">Figma Design Link</option>
                                                    <option value="pdf">PDF Invoice / Document</option>
                                                    <option value="custom">Other (Custom Text)</option>
                                                </select>
                                            </div>
                                            {milestone.proofType === 'custom' && (
                                                <div className="animate-in fade-in">
                                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Specify Custom Proof</label>
                                                    <input
                                                        type="text"
                                                        value={milestone.customProof}
                                                        onChange={e => updateMilestone(idx, 'customProof', e.target.value)}
                                                        placeholder="e.g. Live Vercel Link"
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500/50"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={addMilestone}
                                    className="w-full py-4 border border-dashed border-zinc-800 rounded-xl text-zinc-500 hover:text-white hover:border-zinc-600 hover:bg-zinc-900 transition-all font-medium"
                                >
                                    + Add Another Milestone
                                </button>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(1)} className="text-zinc-400 hover:text-white font-medium px-4">Back</button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={totalPercentage !== 100}
                                    className="bg-white hover:bg-zinc-200 text-black font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
                                >
                                    Review Contract
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-semibold border-b border-zinc-800 pb-4">Step 3: Arbitration & Penalties</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-medium text-emerald-400">Delay Penalties</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Payee Late Penalty (BPS / Day)</label>
                                        <p className="text-xs text-zinc-500 mb-2">100 BPS = 1%. Deducted from seller if they miss the deadline.</p>
                                        <input
                                            type="number" value={payeePenaltyBps} onChange={e => setPayeePenaltyBps(Number(e.target.value))}
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Payer Late Review Penalty (BPS / Day)</label>
                                        <p className="text-xs text-zinc-500 mb-2">100 BPS = 1%. Deducted from buyer if they delay reviewing submitted work past the Review Period.</p>
                                        <input
                                            type="number" value={payerPenaltyBps} onChange={e => setPayerPenaltyBps(Number(e.target.value))}
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-500/50"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Review Period (Days)</label>
                                            <input
                                                type="number" value={reviewPeriod} onChange={e => setReviewPeriod(Number(e.target.value))}
                                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Dispute Window (Days)</label>
                                            <input
                                                type="number" value={disputeWindow} onChange={e => setDisputeWindow(Number(e.target.value))}
                                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-medium text-emerald-400">Arbitration Config</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Arbiter Address</label>
                                        <input
                                            type="text" value={arbiterAddress} onChange={e => setArbiterAddress(e.target.value)}
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50 font-mono text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Arbitration Fee (BPS)</label>
                                        <p className="text-xs text-zinc-500 mb-2">Typically 100-500 BPS (1% to 5%). Paid to arbiter upon resolving disputes.</p>
                                        <input
                                            type="number" value={arbitrationFeeBps} onChange={e => setArbitrationFeeBps(Number(e.target.value))}
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Arbiter Adapter (Advanced)</label>
                                        <input
                                            type="text" value={arbitrationAdapter} onChange={e => setArbitrationAdapter(e.target.value)}
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50 font-mono text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 border-t border-zinc-800 text-sm">
                                <button onClick={() => setStep(2)} className="text-zinc-400 hover:text-white font-medium px-4">Back</button>
                                <button
                                    onClick={() => setStep(4)}
                                    className="bg-white hover:bg-zinc-200 text-black font-semibold py-3 px-6 rounded-xl transition-all"
                                >
                                    Review Contract
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-semibold border-b border-zinc-800 pb-4">Step 4: Payee & Contract Preview</h2>

                            {/* Payee Details */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                                <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                                    <PenLine className="h-4 w-4 text-emerald-500" /> Assign Payee
                                </h3>
                                <p className="text-sm text-zinc-400 mb-4">Enter the wallet address of the payee (freelancer, seller, etc.) who will receive the funds upon completing milestones.</p>
                                <input
                                    type="text"
                                    value={payeeAddress}
                                    onChange={e => setPayeeAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                                />
                            </div>

                            {/* Smart Contract Preview Table */}
                            <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex justify-between items-center">
                                    <span className="font-mono text-sm text-emerald-400 flex items-center gap-2">
                                        <Lock className="h-4 w-4" /> Escrow Contract Configuration
                                    </span>
                                    <button onClick={() => setStep(1)} className="text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded px-2 py-1">Edit Terms</button>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-sm text-left">
                                        <tbody>
                                            <tr className="border-b border-zinc-800/50">
                                                <th className="py-3 px-4 text-zinc-500 font-medium">Buyer (You)</th>
                                                <td className="py-3 px-4 font-mono text-zinc-300">{address || "Connect Wallet"}</td>
                                            </tr>
                                            <tr className="border-b border-zinc-800/50">
                                                <th className="py-3 px-4 text-zinc-500 font-medium">Payee (Seller)</th>
                                                <td className="py-3 px-4 font-mono text-emerald-400/80">{payeeAddress || "Pending Input..."}</td>
                                            </tr>
                                            <tr className="border-b border-zinc-800/50">
                                                <th className="py-3 px-4 text-zinc-500 font-medium">Token Asset</th>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 bg-zinc-800 rounded text-xs">{selectedToken.symbol}</span>
                                                    <span className="ml-2 font-mono text-zinc-500 text-xs">{selectedToken.address}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <th className="py-3 px-4 text-zinc-500 font-medium align-top">Funds Lockup</th>
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-white mb-2">{totalAmount} {selectedToken.symbol} Total</div>
                                                    <div className="space-y-1">
                                                        {milestones.map((m, i) => (
                                                            <div key={i} className="flex justify-between text-xs bg-zinc-900/50 rounded px-2 py-1.5 border border-zinc-800/50">
                                                                <span className="text-zinc-400">M{i + 1}: {m.description.substring(0, 20)}...</span>
                                                                <span className="font-mono text-emerald-400">{(Number(totalAmount) * (m.percentage / 100)).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Warning Box */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-500/90 text-sm">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <div>
                                    <span className="font-semibold block mb-1">Irreversible Blockchain Action</span>
                                    Please review the contract terms above carefully. Once deployed, the milestone structure and funding cannot be unilaterally modified.
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 border-t border-zinc-800">
                                <button onClick={() => setStep(3)} className="text-zinc-400 hover:text-white font-medium px-4">Back</button>
                                <button
                                    onClick={handleDeploy}
                                    disabled={!payeeAddress || isPending || isConfirming}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                >
                                    {isPending || isConfirming ? "Deploying..." : "Confirm & Deploy Escrow"}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
