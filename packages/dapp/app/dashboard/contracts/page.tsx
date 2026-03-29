"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, Copy, Code2, ShieldCheck, Zap, Info, Check, Gavel, Cpu, HardDrive } from "lucide-react"
import { toast } from "sonner"
import { 
    FACTORY_ADDRESS, FACTORY_ABI,
    SIMPLE_ARBITER_ADAPTER_ADDRESS, ARBITER_ADAPTER_ABI,
    VERIFICATION_ORACLE_ADDRESS, VERIFICATION_ORACLE_ABI,
    MILESTONE_ESCROW_ABI, RENTAL_ESCROW_ABI, SERVICE_ESCROW_ABI, LEASE_ESCROW_ABI, B2B_VENDOR_ESCROW_ABI 
} from '@/lib/constants'

type ContractInfo = {
    name: string;
    friendlyName: string;
    type: 'Core Protocol' | 'Peripheral' | 'Template';
    description: string;
    humanDescription: string;
    whyItsSafe: string[];
    address: string;
    abi: any;
    icon: any;
}

const protocolContracts: ContractInfo[] = [
    { 
        name: 'EscrowFactory', 
        friendlyName: 'The Project Architect',
        type: 'Core Protocol', 
        description: 'Main entrypoint for cloning new escrow instances.', 
        humanDescription: 'This is the main engine that builds and launches all secure escrow agreements. It ensures every new contract is built correctly and follows protocol security rules.',
        whyItsSafe: [
            'Ensures every contract has an assigned arbiter.',
            'Uses verified security patterns to prevent fund theft.',
            'Centralized pause mechanism for emergency protection.'
        ],
        address: FACTORY_ADDRESS, 
        abi: FACTORY_ABI,
        icon: Cpu
    },
    { 
        name: 'MilestoneEscrow', 
        friendlyName: 'The Step-by-Step Guard',
        type: 'Template', 
        description: 'Escrow implementation with multiple phased milestones.', 
        humanDescription: 'Designed for projects with multiple phases. It holds the total budget and only releases payments in specific steps after work is submitted and approved.',
        whyItsSafe: [
            'Funds are locked until you approve the work.',
            'Automatic refund logic if deadlines are missed.',
            'Arbiter can intervene if a milestone is contested.'
        ],
        address: 'Dynamic Generation', 
        abi: MILESTONE_ESCROW_ABI,
        icon: ShieldCheck
    },
    { 
        name: 'RentalEscrow', 
        friendlyName: 'The Security Deposit Vault',
        type: 'Template', 
        description: 'Handles deposits and lease durations for property/assets.', 
        humanDescription: 'Ideal for property or equipment rentals. It safely holds security deposits for the duration of a lease and handles damage claims at the end.',
        whyItsSafe: [
            'Deposit is held in a neutral digital vault.',
            'Automatic return of deposit if no claim is made.',
            'Dispute mechanism for unfair damage claims.'
        ],
        address: 'Dynamic Generation', 
        abi: RENTAL_ESCROW_ABI,
        icon: HardDrive
    },
    { 
        name: 'SimpleArbiterAdapter', 
        friendlyName: 'The Resolution Center',
        type: 'Peripheral', 
        description: 'Handles dispute resolutions via fixed arbitration workflows.', 
        humanDescription: 'This contract acts as a digital judge. When parties disagree, it manages the evidence and allows a neutral third party to make a binding ruling.',
        whyItsSafe: [
            'Moves funds into a "frozen" state during disputes.',
            'Only authorized arbiters can decide the outcome.',
            'Provides a clear, on-chain record of the decision.'
        ],
        address: SIMPLE_ARBITER_ADAPTER_ADDRESS, 
        abi: ARBITER_ADAPTER_ABI,
        icon: Gavel
    },
    { 
        name: 'VerificationOracle', 
        friendlyName: 'The Automated Inspector',
        type: 'Peripheral', 
        description: 'Verifies external conditions and metadata conditions for milestones.', 
        humanDescription: 'A digital notary that can automatically check if certain conditions are met (like a file being uploaded) before allowing funds to move.',
        whyItsSafe: [
            'Eliminates human error in simple verifications.',
            'Can automate release based on verified off-chain events.',
            'Ensures data integrity before payment release.'
        ],
        address: VERIFICATION_ORACLE_ADDRESS, 
        abi: VERIFICATION_ORACLE_ABI,
        icon: Zap
    },
    { 
        name: 'ServiceEscrow', 
        friendlyName: 'The Simple Task Protector',
        type: 'Template', 
        description: 'Simple gig-based escrow with direct review periods.', 
        humanDescription: 'Perfect for one-off tasks. It holds payment securely and includes a review period for the client to check the final deliverable.',
        whyItsSafe: [
            'Client must confirm satisfaction before payout.',
            'Built-in review timer for fair provider payment.',
            'Standardized dispute windows for all jobs.'
        ],
        address: 'Dynamic Generation', 
        abi: SERVICE_ESCROW_ABI,
        icon: Info
    },
]

export default function ContractsPage() {
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const handleCopyABI = (name: string, abi: any) => {
        navigator.clipboard.writeText(JSON.stringify(abi, null, 2));
        setCopiedStates({ ...copiedStates, [name]: true });
        toast.success(`${name} ABI copied to clipboard`);
        setTimeout(() => setCopiedStates(prev => ({ ...prev, [name]: false })), 2000);
    }

    const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.basescan.org";

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-50 mb-2 flex items-center gap-3">
                    <Code2 className="h-8 w-8 text-emerald-500" /> Smart Contracts Registry
                </h1>
                <p className="text-neutral-400 max-w-2xl text-lg">
                    Explore the on-chain infrastructure powering your secure payments. Learn how EscrowKit protects your funds through transparent, immutable code.
                </p>
            </div>

            <Card className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-neutral-800/50 bg-neutral-900/50">
                    <CardTitle className="text-neutral-50">Deployed Architecture</CardTitle>
                    <CardDescription className="text-neutral-400">
                        Network: <Badge variant="outline" className="text-emerald-400 border-emerald-900 bg-emerald-900/10 ml-2">Base Sepolia</Badge>
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-neutral-800 hover:bg-transparent">
                                    <TableHead className="text-neutral-500 font-medium pl-6">Contract Name</TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Type</TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Address</TableHead>
                                    <TableHead className="text-right text-neutral-500 font-medium pr-6 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {protocolContracts.map((contract) => (
                                    <TableRow key={contract.name} className="border-neutral-800 hover:bg-neutral-800/30 group">
                                        <TableCell className="font-medium text-neutral-200 py-6 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 group-hover:text-emerald-400 transition-colors">
                                                    <contract.icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg">{contract.friendlyName}</span>
                                                    <span className="text-xs text-neutral-500 font-mono italic">{contract.name}.sol</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant="secondary" 
                                                className={
                                                    contract.type === 'Core Protocol' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                    contract.type === 'Peripheral' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }
                                            >
                                                {contract.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm text-neutral-400">
                                            {contract.address === 'Dynamic Generation' ? (
                                                <span className="italic text-neutral-600 px-2 py-1 bg-neutral-950 rounded border border-neutral-800">
                                                    Escrow Instance
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-2 group/addr">
                                                    <span className="bg-neutral-950 px-2 py-1 rounded border border-neutral-800 font-mono text-neutral-300">
                                                        {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                                                    </span>
                                                    <a 
                                                        href={`${explorerUrl}/address/${contract.address}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-neutral-500 hover:text-emerald-400 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="border-emerald-900/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all font-semibold"
                                                    >
                                                        View & Learn
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 sm:max-w-[700px] p-0 overflow-hidden">
                                                    <div className="h-1.5 w-full bg-emerald-500"></div>
                                                    <div className="p-8">
                                                        <DialogHeader className="mb-6">
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                                                                    <contract.icon className="h-8 w-8" />
                                                                </div>
                                                                <div>
                                                                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                                                        {contract.friendlyName}
                                                                        <Badge variant="secondary" className="text-[10px] font-mono opacity-60 h-5 px-1.5">{contract.name}.sol</Badge>
                                                                    </DialogTitle>
                                                                    <DialogDescription className="text-neutral-400 mt-1">
                                                                        Learn how the {contract.name} contract protects your transactions.
                                                                    </DialogDescription>
                                                                </div>
                                                            </div>
                                                        </DialogHeader>

                                                        <Tabs defaultValue="guide" className="w-full">
                                                            <TabsList className="bg-neutral-950 border border-neutral-800 p-1 mb-6">
                                                                <TabsTrigger value="guide" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all">
                                                                    Human Guide
                                                                </TabsTrigger>
                                                                <TabsTrigger value="technical" className="data-[state=active]:bg-neutral-800 transition-all font-mono text-xs">
                                                                    Technical ABI
                                                                </TabsTrigger>
                                                            </TabsList>
                                                            
                                                            <TabsContent value="guide" className="space-y-6 mt-0">
                                                                <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
                                                                    <h4 className="text-emerald-500 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                        <Info className="h-4 w-4" /> The Purpose
                                                                    </h4>
                                                                    <p className="text-neutral-200 leading-relaxed italic text-lg pr-4">
                                                                        "{contract.humanDescription}"
                                                                    </p>
                                                                </div>

                                                                <div className="grid gap-4">
                                                                    <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                                                        <ShieldCheck className="h-4 w-4" /> Why It's Safe
                                                                    </h4>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        {contract.whyItsSafe.map((point, i) => (
                                                                            <div key={i} className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                                                                                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                                                <span className="text-sm text-neutral-300">{point}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                
                                                                {contract.address !== 'Dynamic Generation' && (
                                                                    <div className="pt-4 flex items-center justify-between border-t border-neutral-800">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] text-neutral-500 uppercase font-bold">On-Chain Reality</span>
                                                                            <code className="text-xs text-neutral-400 font-mono mt-1">{contract.address}</code>
                                                                        </div>
                                                                        <a 
                                                                            href={`${explorerUrl}/address/${contract.address}`} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 text-sm text-emerald-500 hover:text-emerald-400 underline underline-offset-4"
                                                                        >
                                                                            Check Verified Code <ExternalLink className="h-3 w-3" />
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </TabsContent>

                                                            <TabsContent value="technical" className="space-y-4 mt-0">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Interface Definitions</span>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        className="h-7 text-xs text-emerald-500 hover:bg-emerald-500/10 gap-1.5"
                                                                        onClick={() => handleCopyABI(contract.name, contract.abi)}
                                                                    >
                                                                        {copiedStates[contract.name] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                                        {copiedStates[contract.name] ? "Copied" : "Copy JSON"}
                                                                    </Button>
                                                                </div>
                                                                <pre className="bg-black/80 p-5 rounded-2xl overflow-x-auto text-[10px] font-mono text-emerald-400/70 border border-neutral-800 max-h-[300px] custom-scrollbar">
                                                                    {JSON.stringify(contract.abi, null, 2)}
                                                                </pre>
                                                                <p className="text-[10px] text-neutral-600 italic">
                                                                    Note: This ABI represents the technical interface developers use to communicate with the {contract.name}.
                                                                </p>
                                                            </TabsContent>
                                                        </Tabs>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

