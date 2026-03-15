"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowRight, ArrowLeft, Loader2, Check, Shield, Briefcase, FileText, Lock, AlertTriangle, PenLine } from "lucide-react"

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
import Link from "next/link"

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { useRouter } from "next/navigation"
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/lib/constants"
import { cn } from "@/lib/utils"

const formSchema = z.object({
    vendorAddress: z.string().min(42, "Invalid Ethereum address").max(42, "Invalid Ethereum address"),
    projectTitle: z.string().optional(),
    
    arbiterAddress: z.string().optional(),
    arbitrationFeeBps: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10000, {
        message: "Fee must be between 0 and 10000 BPS",
    }),
    arbitrationAdapter: z.string().optional(),

    depositAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Amount must be a positive number",
    }),
    paymentTermDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: "Payment term must be at least 1 day",
    }),
    deadlineDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Deadline days must be 0 or positive",
    }),
    payeePenaltyBps: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10000, {
        message: "Penalty must be between 0 and 10000 BPS",
    }),
})

export default function CreateB2BVendorEscrow() {
    const router = useRouter()
    const [step, setStep] = useState(1)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            vendorAddress: "",
            projectTitle: "",
            arbiterAddress: "",
            arbitrationFeeBps: "500", // 5%
            arbitrationAdapter: "",
            depositAmount: "",
            paymentTermDays: "30",
            deadlineDays: "0",
            payeePenaltyBps: "0",
        },
    })

    const { data: hash, writeContract, isPending, error } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

    useEffect(() => {
        if (isSuccess) {
            router.push('/dashboard/escrows')
        }
    }, [isSuccess, router])

    function onSubmit(values: z.infer<typeof formSchema>) {
        const arbiter = (values.arbiterAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`;
        const adapter = (values.arbitrationAdapter || '0x0000000000000000000000000000000000000000') as `0x${string}`;
        const token = '0x0000000000000000000000000000000000000000' as `0x${string}`;

        // Calculate absolute deadline timestamp if deadlineDays > 0
        const deadlineTimestamp = values.deadlineDays && Number(values.deadlineDays) > 0 
            ? Math.floor(Date.now() / 1000) + (Number(values.deadlineDays) * 86400)
            : 0;

        writeContract({
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: 'createB2BVendorEscrow',
            args: [
                values.vendorAddress as `0x${string}`,
                arbiter,
                adapter,
                token,
                parseEther(values.depositAmount),
                BigInt(deadlineTimestamp),
                {
                    arbitrationFeeBps: BigInt(values.arbitrationFeeBps),
                    paymentTermDays: BigInt(values.paymentTermDays),
                    payeePenaltyBps: BigInt(values.payeePenaltyBps) // Only kicks in if deadline > 0
                }
            ],
            value: parseEther(values.depositAmount) // Send ETH
        });
    }

    const handleNextStep1 = async () => {
        const isValid = await form.trigger(["vendorAddress", "projectTitle"]);
        if (isValid) setStep(2);
    }

    const handleNextStep2 = async () => {
        const isValid = await form.trigger(["arbiterAddress", "arbitrationFeeBps", "arbitrationAdapter"]);
        if (isValid) setStep(3);
    }

    const handleNextStep3 = async () => {
        const isValid = await form.trigger(["depositAmount", "paymentTermDays", "deadlineDays", "payeePenaltyBps"]);
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
                        B2B Vendor Wizard
                        <Badge variant="outline" className="text-indigo-400 border-indigo-900 bg-indigo-900/10">B2B Vendor</Badge>
                    </h1>
                    <p className="text-neutral-400 mt-2">Create a secure B2B payment escrow with precise invoice management and robust Net-X payment term tracking.</p>

                    {/* Progress Bar */}
                    <div className="flex gap-2 mt-6">
                        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-indigo-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 4 ? 'bg-indigo-500' : 'bg-neutral-800'}`}></div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex-1">
                        {step === 1 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 1: Parties Overview</CardTitle>
                                    <CardDescription className="text-neutral-400">Establish the business relationship entities.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="projectTitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-200">Contract Title / Reference</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Q4 Logistics Partnership" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Internal UI reference title.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="vendorAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-200">Vendor Wallet Address (Payee) *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="0x..." className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">The business receiving the funds.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                                <CardFooter className="flex justify-end border-t border-neutral-800 pt-6">
                                    <Button type="button" onClick={handleNextStep1} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        Arbitration Settings <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 2 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 2: Arbitration Config</CardTitle>
                                    <CardDescription className="text-neutral-400">Configure parameters for dispute handling.</CardDescription>
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
                                                <FormDescription className="text-neutral-500 text-xs">Third party resolver in case of disputes.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="arbitrationFeeBps"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Arbitration Fee (BPS)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="500" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Fee given to arbiter (100 = 1%).</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="arbitrationAdapter"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Arbitration Adapter</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="0x..." className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Advanced API binding.</FormDescription>
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
                                    <Button type="button" onClick={handleNextStep2} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        Payment Settings <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 3 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 3: Payment Configuration</CardTitle>
                                    <CardDescription className="text-neutral-400">Set the payment terms, deadlines, and deposit structures.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="depositAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-300">Invoice / Contract Total (ETH) *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="10.5" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="paymentTermDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Payment Term (Days) *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="30" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Days before auto-release after submission (Net-X).</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="deadlineDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Delivery Deadline (Days)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="0" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">0 means no strict deadline penalty.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="payeePenaltyBps"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-300">Vendor Late Penalty (BPS/Day)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="0" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Active only if Delivery Deadline is missed.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                </CardContent>
                                <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                    <Button type="button" variant="ghost" onClick={() => setStep(2)} className="text-neutral-400">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={handleNextStep3} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        Review Deployment <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 4 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 4: Review & Deploy</CardTitle>
                                    <CardDescription className="text-neutral-400">Review your B2B contract setup before broadcasting to the blockchain.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    
                                    <div className="bg-neutral-950/50 rounded-xl border border-neutral-800 p-4 space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Project Reference:</span>
                                            <span className="font-semibold text-neutral-100">{form.getValues('projectTitle') || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Vendor Address:</span>
                                            <span className="font-mono text-indigo-400 text-xs">{form.getValues('vendorAddress')}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Arbiter Address:</span>
                                            <span className="font-mono text-neutral-300 text-xs">{form.getValues('arbiterAddress') || 'None'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Contract Total</span>
                                                <span className="font-mono text-lg text-emerald-500">{form.getValues('depositAmount')} ETH</span>
                                            </div>
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Payment Term</span>
                                                <span className="font-mono text-lg text-indigo-400">Net-{form.getValues('paymentTermDays')}</span>
                                            </div>
                                        </div>
                                        {Number(form.getValues('deadlineDays')) > 0 && (
                                            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded text-sm text-rose-400 flex items-start gap-2">
                                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                                <p>Vendor must submit invoice within {form.getValues('deadlineDays')} days, or faces a late penalty of {Number(form.getValues('payeePenaltyBps')) / 100}% per day.</p>
                                            </div>
                                        )}
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
                                    <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium" disabled={isPending || isConfirming}>
                                        {isPending || isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                                        {isPending ? 'Confirming Transaction...' : isConfirming ? 'Deploying Contract...' : 'Approve & Deploy Contract'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </form>
                </Form>
            </div>

            {/* Side Guide Area */}
            <div className="hidden lg:block space-y-6 pt-16 mt-4">
                <Card className="bg-neutral-900 border-neutral-800 sticky top-10">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-400">
                            <PenLine className="h-4 w-4" /> B2B Guidelines
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-neutral-400 space-y-3">
                        <p><strong>Step 1:</strong> Select the primary corporate vendor your account will be interfacing with.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 2:</strong> Set an optional arbiter to handle conflicts involving delivered goods or disputed invoice amounts.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 3:</strong> Establish the Net terms. For Net-30, set Payment Term to 30. Auto-release will trigger 30 days after vendor submits invoice link.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
