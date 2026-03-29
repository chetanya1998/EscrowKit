"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, Code2, ChevronDown, ChevronRight, Check } from "lucide-react"
import { toast } from "sonner"
import { 
    FACTORY_ADDRESS, FACTORY_ABI,
    SIMPLE_ARBITER_ADAPTER_ADDRESS, ARBITER_ADAPTER_ABI,
    VERIFICATION_ORACLE_ADDRESS, VERIFICATION_ORACLE_ABI,
    MILESTONE_ESCROW_ABI, RENTAL_ESCROW_ABI, SERVICE_ESCROW_ABI, LEASE_ESCROW_ABI, B2B_VENDOR_ESCROW_ABI 
} from '@/lib/constants'

type ContractInfo = {
    name: string;
    type: string;
    description: string;
    address: string;
    abi: any;
}

const protocolContracts: ContractInfo[] = [
    { name: 'EscrowFactory', type: 'Core Protocol', description: 'Main entrypoint for cloning new escrow instances.', address: FACTORY_ADDRESS, abi: FACTORY_ABI },
    { name: 'SimpleArbiterAdapter', type: 'Peripheral', description: 'Handles dispute resolutions via fixed arbitration workflows.', address: SIMPLE_ARBITER_ADAPTER_ADDRESS, abi: ARBITER_ADAPTER_ABI },
    { name: 'VerificationOracle', type: 'Peripheral', description: 'Verifies external conditions and metadata conditions for milestones.', address: VERIFICATION_ORACLE_ADDRESS, abi: VERIFICATION_ORACLE_ABI },
    { name: 'MilestoneEscrow', type: 'Template', description: 'Escrow implementation with multiple phased milestones.', address: 'Dynamic Generation', abi: MILESTONE_ESCROW_ABI },
    { name: 'RentalEscrow', type: 'Template', description: 'Handles deposits and lease durations for property/assets.', address: 'Dynamic Generation', abi: RENTAL_ESCROW_ABI },
    { name: 'ServiceEscrow', type: 'Template', description: 'Simple gig-based escrow with direct review periods.', address: 'Dynamic Generation', abi: SERVICE_ESCROW_ABI },
    { name: 'LeaseEscrow', type: 'Template', description: 'Long-term leasing with recurring claimant logic.', address: 'Dynamic Generation', abi: LEASE_ESCROW_ABI },
    { name: 'B2BVendorEscrow', type: 'Template', description: 'B2B transactions involving invoices and vendor workflows.', address: 'Dynamic Generation', abi: B2B_VENDOR_ESCROW_ABI },
]

export default function ContractsPage() {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const handleCopyABI = (name: string, abi: any) => {
        navigator.clipboard.writeText(JSON.stringify(abi, null, 2));
        setCopiedStates({ ...copiedStates, [name]: true });
        toast.success(`${name} ABI copied to clipboard`);
        setTimeout(() => setCopiedStates(prev => ({ ...prev, [name]: false })), 2000);
    }

    const toggleRow = (name: string) => {
        setExpandedRow(expandedRow === name ? null : name);
    }

    const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.basescan.org";

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-50 mb-2 flex items-center gap-3">
                    <Code2 className="h-8 w-8 text-emerald-500" /> Smart Contracts Registry
                </h1>
                <p className="text-neutral-400 max-w-2xl">
                    View protocol addresses, integration ABIs, and template definitions here. Use this information to integrate external applications directly with EscrowKit's smart contracts.
                </p>
            </div>

            <Card className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden">
                <CardHeader>
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
                                    <TableHead className="w-8"></TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Contract Name</TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Type</TableHead>
                                    <TableHead className="text-neutral-500 font-medium">Address</TableHead>
                                    <TableHead className="text-right text-neutral-500 font-medium">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {protocolContracts.map((contract) => (
                                    <React.Fragment key={contract.name}>
                                        <TableRow 
                                            className="border-neutral-800 hover:bg-neutral-800/30 cursor-pointer"
                                            onClick={() => toggleRow(contract.name)}
                                        >
                                            <TableCell className="p-4">
                                                {expandedRow === contract.name ? 
                                                    <ChevronDown className="h-4 w-4 text-neutral-400" /> : 
                                                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                                                }
                                            </TableCell>
                                            <TableCell className="font-medium text-neutral-200">
                                                <div className="flex flex-col">
                                                    <span>{contract.name}</span>
                                                    <span className="text-xs text-neutral-500 font-normal">{contract.description}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant="secondary" 
                                                    className={
                                                        contract.type === 'Core Protocol' ? 'bg-purple-500/10 text-purple-400' :
                                                        contract.type === 'Peripheral' ? 'bg-amber-500/10 text-amber-400' :
                                                        'bg-neutral-800 text-neutral-400'
                                                    }
                                                >
                                                    {contract.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm text-neutral-400">
                                                {contract.address === 'Dynamic Generation' ? (
                                                    <span className="italic text-neutral-600">Generated per Escrow</span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span>{contract.address.slice(0, 6)}...{contract.address.slice(-4)}</span>
                                                        <a 
                                                            href={`${explorerUrl}/address/${contract.address}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-neutral-500 hover:text-emerald-400 transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-emerald-400 h-8 gap-2"
                                                    onClick={(e) => { e.stopPropagation(); handleCopyABI(contract.name, contract.abi); }}
                                                >
                                                    {copiedStates[contract.name] ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                                    Copy ABI
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        
                                        {/* Expandable ABI Details */}
                                        {expandedRow === contract.name && (
                                            <TableRow className="bg-neutral-950/50 border-neutral-800 hover:bg-neutral-950/50">
                                                <TableCell colSpan={5} className="p-0 border-b-0">
                                                    <div className="p-6 transition-all border-l-2 border-emerald-500/50 ml-4 my-2 rounded-r-lg bg-neutral-900/50">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                                                                <Code2 className="h-4 w-4" /> Contract Interface (ABI) Details
                                                            </h4>
                                                        </div>
                                                        <div className="relative group">
                                                            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button 
                                                                    variant="secondary" 
                                                                    size="sm" 
                                                                    className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700 h-8 gap-2"
                                                                    onClick={() => handleCopyABI(contract.name, contract.abi)}
                                                                >
                                                                    {copiedStates[contract.name] ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                                                    Copy Raw JSON
                                                                </Button>
                                                            </div>
                                                            <pre className="bg-black/60 p-4 rounded-xl overflow-x-auto text-xs font-mono text-emerald-400/80 custom-scrollbar max-h-96 border border-neutral-800">
                                                                {JSON.stringify(contract.abi, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
