"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowRight, ArrowLeft, Loader2, Shield, AlertTriangle, Home } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { TokenSelector } from "@/components/token-selector"

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { decodeEventLog, parseUnits } from "viem"
import { useRouter } from "next/navigation"
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/lib/constants"
import { Token, SUPPORTED_TOKENS, ZERO_ADDRESS } from "@/lib/tokens"

const formSchema = z.object({
    landlordAddress: z.string().min(42, "Invalid Ethereum address").max(42, "Invalid Ethereum address"),
    propertyReference: z.string().optional(),

    arbiterAddress: z.string().optional(),
    arbitrationFee: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Fee must be 0 or positive",
    }),
    disputeWindowDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Dispute window must be 0 or positive",
    }),

    depositAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Deposit amount must be a positive number",
    }),
    claimWindowDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: "Claim window must be at least 1 day",
    }),
})

export default function CreateRentalEscrow() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [selectedToken, setSelectedToken] = useState<Token>(SUPPORTED_TOKENS[0])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema as any),
        defaultValues: {
            landlordAddress: "",
            propertyReference: "",
            arbiterAddress: "",
            arbitrationFee: "0.01",
            disputeWindowDays: "7",
            depositAmount: "",
            claimWindowDays: "14",
        },
    })

    const { data: hash, writeContract, isPending, error } = useWriteContract()
    const { isLoading: isConfirming, data: receipt } = useWaitForTransactionReceipt({ hash })

    useEffect(() => {
        if (!receipt) {
            return
        }

        const createdLog = receipt.logs.find((log) => {
            try {
                const decoded = decodeEventLog({
                    abi: FACTORY_ABI,
                    data: log.data,
                    topics: log.topics,
                })

                return decoded.eventName === "EscrowCreatedV2"
            } catch {
                return false
            }
        })

        if (!createdLog) {
            router.push('/dashboard/escrows')
            return
        }

        const decoded = decodeEventLog({
            abi: FACTORY_ABI,
            data: createdLog.data,
            topics: createdLog.topics,
        }) as unknown as { args: { escrowAddress: `0x${string}` } }

        router.push(`/escrow?address=${decoded.args.escrowAddress}`)
    }, [receipt, router])

    function onSubmit(values: z.infer<typeof formSchema>) {
        const arbiter = (values.arbiterAddress || ZERO_ADDRESS) as `0x${string}`;
        const adapter = ZERO_ADDRESS as `0x${string}`;
        const tokenAddr = selectedToken.address;

        writeContract({
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: 'createRentalEscrow',
            args: [
                values.landlordAddress as `0x${string}`,
                arbiter,
                adapter,
                tokenAddr,
                parseUnits(values.depositAmount, selectedToken.decimals),
                {
                    arbitrationFee: parseUnits(values.arbitrationFee, selectedToken.decimals),
                    disputeWindow: BigInt(Number(values.disputeWindowDays) * 86400),
                    claimWindow: BigInt(Number(values.claimWindowDays) * 86400),
                }
            ],
            value: BigInt(0)
        });
    }

    const handleNextStep1 = async () => {
        const isValid = await form.trigger(["landlordAddress", "propertyReference"]);
        if (isValid) setStep(2);
    }

    const handleNextStep2 = async () => {
        const isValid = await form.trigger(["arbiterAddress", "arbitrationFee", "disputeWindowDays"]);
        if (isValid) setStep(3);
    }

    const handleNextStep3 = async () => {
        const isValid = await form.trigger(["depositAmount", "claimWindowDays"]);
        if (isValid) setStep(4);
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 grid gap-8 lg:grid-cols-[1fr_300px]">
            <div className="flex flex-col">
                <div className="mb-6">
                    <Link href="/dashboard/templates" className="text-neutral-500 hover:text-neutral-300 flex items-center gap-2 mb-4 w-fit transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Templates
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-50 flex items-center gap-3">
                        Property Rental
                        <Badge variant="outline" className="text-emerald-400 border-emerald-900 bg-emerald-900/10">Rental</Badge>
                    </h1>
                    <p className="text-neutral-400 mt-2">Deploy a secure deposit escrow with predefined claim windows and dispute rights.</p>

                    <div className="flex gap-2 mt-6">
                        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 4 ? 'bg-emerald-500' : 'bg-neutral-800'}`}></div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex-1">

                        {step === 1 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 1: Parties</CardTitle>
                                    <CardDescription className="text-neutral-400">Identify the landlord and property context.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="propertyReference"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-200">Property Reference</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 2BR Apartment - Downtown" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Internal label for this property.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="landlordAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-200">Landlord Wallet Address *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="0x..." className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">The landlord who can file claims against the deposit.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator className="bg-neutral-800" />

                                    <TokenSelector
                                        value={selectedToken.address}
                                        onChange={setSelectedToken}
                                        label="Deposit Currency"
                                    />
                                </CardContent>
                                <CardFooter className="flex justify-end border-t border-neutral-800 pt-6">
                                    <Button type="button" onClick={handleNextStep1} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        Arbitration Config <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 2 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 2: Arbitration Config</CardTitle>
                                    <CardDescription className="text-neutral-400">Configure dispute resolution and arbitration parameters.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="arbiterAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-200">Arbiter Address (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="0x..." className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Third-party referee for deposit disputes. Leave blank for no arbitration.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="arbitrationFee"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Arbitration Fee (ETH)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="0.01" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Fee required to open arbitration.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="disputeWindowDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Dispute Window (Days)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="7" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Days tenant has to dispute a landlord claim.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                    <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-neutral-400">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={handleNextStep2} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        Deposit Terms <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 3 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 3: Deposit Terms</CardTitle>
                                    <CardDescription className="text-neutral-400">Set the security deposit amount and claim window duration.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="depositAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-300">Security Deposit (ETH) *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="1.5" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">The exact amount the tenant must deposit into escrow.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="claimWindowDays"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-300">Claim Window (Days) *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="14" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Duration landlord has after lease end to file for damages. After this, tenant can auto-withdraw.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                                <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                    <Button type="button" variant="ghost" onClick={() => setStep(2)} className="text-neutral-400">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={handleNextStep3} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        Review Deployment <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 4 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 4: Review & Deploy</CardTitle>
                                    <CardDescription className="text-neutral-400">Review your rental escrow setup before deploying on-chain.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-neutral-950/50 rounded-xl border border-neutral-800 p-4 space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Property:</span>
                                            <span className="font-semibold text-neutral-100">{form.getValues('propertyReference') || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Landlord:</span>
                                            <span className="font-mono text-emerald-400 text-xs">{form.getValues('landlordAddress')}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Arbiter:</span>
                                            <span className="font-mono text-neutral-300 text-xs">{form.getValues('arbiterAddress') || 'None (No Arbitration)'}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Deposit</span>
                                                <span className="font-mono text-lg text-emerald-500">{form.getValues('depositAmount')} ETH</span>
                                            </div>
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Claim Window</span>
                                                <span className="font-mono text-lg text-emerald-400">{form.getValues('claimWindowDays')} days</span>
                                            </div>
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Dispute Window</span>
                                                <span className="font-mono text-lg text-emerald-400">{form.getValues('disputeWindowDays')} days</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-500/90 text-sm">
                                        <AlertTriangle className="h-5 w-5 shrink-0" />
                                        <div>
                                            <span className="font-semibold block mb-1">On-Chain Deposit Contract</span>
                                            Once deployed, the tenant will be required to fund exactly {form.getValues('depositAmount')} ETH. The landlord has {form.getValues('claimWindowDays')} days after lease end to claim damages.
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-red-500 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded">
                                            {(error as any).shortMessage || error.message}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                    <Button type="button" variant="ghost" onClick={() => setStep(3)} className="text-neutral-400" disabled={isPending || isConfirming}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium" disabled={isPending || isConfirming}>
                                        {isPending || isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                                        {isPending ? 'Confirming...' : isConfirming ? 'Deploying...' : 'Approve & Deploy Contract'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </form>
                </Form>
            </div>

            {/* Side Guide */}
            <div className="hidden lg:block space-y-6 pt-16 mt-4">
                <Card className="bg-neutral-900 border-neutral-800 sticky top-10">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-400">
                            <Home className="h-4 w-4" /> Rental Guide
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-neutral-400 space-y-3">
                        <p><strong>Step 1:</strong> Specify the landlord wallet that will have claim rights over the deposit.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 2:</strong> Set up an optional arbiter and dispute window for contested claims.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 3:</strong> Define the security deposit amount and claim window for the landlord.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 4:</strong> Review and deploy. The tenant will need to fund the deposit after contract creation.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
