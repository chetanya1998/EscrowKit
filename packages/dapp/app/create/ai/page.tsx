"use client";

import { useState } from "react";
import { AIEscrowEditor, AiEscrowConfig } from "@/components/escrow/AIEscrowEditor";
import { Sparkles, ArrowRight, Loader2, Bot, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AIEscrowPage() {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState<AiEscrowConfig | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateEscrow = async (textPrompt: string, template?: string) => {
        setIsLoading(true);
        setError(null);
        setConfig(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.escrowkit.com';

            const res = await fetch(`${apiUrl}/ai/generate-escrow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: textPrompt, predefinedTemplate: template })
            });

            if (!res.ok) {
                throw new Error("Failed to generate escrow configuration from AI.");
            }

            const data = await res.json();
            setConfig(data);
        } catch (err: any) {
            console.error("AI Gen Error:", err);
            setError(err.message || "An unexpected error occurred while generating the escrow configuration.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        generateEscrow(prompt);
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto mt-8 relative z-10">
                <Link href="/dashboard" className="text-zinc-500 hover:text-white flex items-center gap-2 mb-8 transition-colors w-fit">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <Sparkles className="h-5 w-5 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-zinc-500 text-transparent bg-clip-text">
                        AI Escrow Builder
                    </h1>
                </div>
                <p className="text-zinc-400 mb-12 max-w-2xl text-lg">
                    Describe your project or terms in plain English, or pick a template. Our AI will automatically structure the milestone breakdown, calculate real-time exchange rates (like INR/e₹ to USDC), and generate integration code for you.
                </p>

                {!config ? (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Prompt Input Section */}
                        <div className="lg:col-span-3 space-y-6">
                            <form onSubmit={handleGenerate} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-zinc-800/50 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-emerald-500" />
                                        Prompt the AI
                                    </h2>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="E.g. I am hiring a developer for a Mobile App. The total cost is 150,000 e-Rupaiya. I want to pay 20% upfront, 40% on design approval, and 40% on testflight delivery."
                                        className="w-full h-40 bg-black border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                                        disabled={isLoading}
                                    />

                                    {error && (
                                        <div className="mt-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-lg">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading || !prompt.trim()}
                                        className="mt-4 w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                                                Generating Escrow Physics...
                                            </>
                                        ) : (
                                            <>
                                                Generate Configuration
                                                <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Templates Section */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <LayoutTemplate className="h-5 w-5 text-zinc-400" />
                                Quick Templates
                            </h2>

                            <button
                                onClick={() => generateEscrow("", "freelance")}
                                disabled={isLoading}
                                className="w-full text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/30 transition-all group"
                            >
                                <div className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">Freelance Development</div>
                                <div className="text-sm text-zinc-500">Standard 3-step milestone breakdown for software projects.</div>
                            </button>

                            <button
                                onClick={() => generateEscrow("", "rental")}
                                disabled={isLoading}
                                className="w-full text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/30 transition-all group"
                            >
                                <div className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">Rental Deposit</div>
                                <div className="text-sm text-zinc-500">Secure lockup for property deposits with automated release conditions.</div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-8">
                            <button
                                onClick={() => setConfig(null)}
                                className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors text-sm"
                            >
                                <ArrowLeft className="h-4 w-4" /> Start Over
                            </button>

                            <button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-6 rounded-lg transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                Deploy via Gateway
                            </button>
                        </div>

                        <AIEscrowEditor config={config} />
                    </div>
                )}
            </div>
        </div>
    );
}
