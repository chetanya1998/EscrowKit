"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowRight, ArrowLeft, Loader2, Shield, AlertTriangle, FileText } from "lucide-react"
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

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { useRouter } from "next/navigation"
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/lib/constants"

const formSchema = z.object({
    lessorAddress: z.string().min(42, "Invalid Ethereum address").max(42, "Invalid Ethereum address"),
    leaseLabel: z.string().optional(),

    arbiterAddress: z.string().optional(),
    arbitrationFeeBps: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10000, {
        message: "Fee must be between 0 and 10000 BPS",
    }),

    totalPeriods: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 2, {
        message: "A lease must have at least 2 periods",
    }),
    periodDurationDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: "Each period must be at least 1 day",
    }),
    amountPerPeriod: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Amount must be a positive number",
    }),
})

export default function CreateLeaseEscrow() {
    const router = useRouter()
    const [step, setStep] = useState(1)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema as any),
        defaultValues: {
            lessorAddress: "",
            leaseLabel: "",
            arbiterAddress: "",
            arbitrationFeeBps: "500",
            totalPeriods: "12",
            periodDurationDays: "30",
            amountPerPeriod: "",
        },
    })

    const { data: hash, writeContract, isPending, error } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

    useEffect(() => {
        if (isSuccess) {
            router.push('/dashboard/escrows')
        }
    }, [isSuccess, router])

    const watchedPeriods = form.watch("totalPeriods")
    const watchedAmount = form.watch("amountPerPeriod")
    const watchedDuration = form.watch("periodDurationDays")
    const totalETH = (Number(watchedPeriods) || 0) * (Number(watchedAmount) || 0)
    const totalDays = (Number(watchedPeriods) || 0) * (Number(watchedDuration) || 0)

    function onSubmit(values: z.infer<typeof formSchema>) {
        const arbiter = (values.arbiterAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`;
        const adapter = '0x0000000000000000000000000000000000000000' as `0x${string}`;
        const token = '0x0000000000000000000000000000000000000000' as `0x${string}`;

        const periodDurationSeconds = Number(values.periodDurationDays) * 86400;
        const expectedTotal = Number(values.totalPeriods) * Number(values.amountPerPeriod);

        writeContract({
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: 'createLeaseEscrow',
            args: [
                values.lessorAddress as `0x${string}`,
                arbiter,
                adapter,
                token,
                {
                    totalPeriods: BigInt(values.totalPeriods),
                    periodDuration: BigInt(periodDurationSeconds),
                    amountPerPeriod: parseEther(values.amountPerPeriod),
                    arbitrationFeeBps: BigInt(values.arbitrationFeeBps),
                }
            ],
            value: parseEther(expectedTotal.toString())
        });
    }

    const handleNextStep1 = async () => {
        const isValid = await form.trigger(["lessorAddress", "leaseLabel"]);
        if (isValid) setStep(2);
    }

    const handleNextStep2 = async () => {
        const isValid = await form.trigger(["arbiterAddress", "arbitrationFeeBps"]);
        if (isValid) setStep(3);
    }

    const handleNextStep3 = async () => {
        const isValid = await form.trigger(["totalPeriods", "periodDurationDays", "amountPerPeriod"]);
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
                        Lease Agreement
                        <Badge variant="outline" className="text-amber-400 border-amber-900 bg-amber-900/10">Lease</Badge>
                    </h1>
                    <p className="text-neutral-400 mt-2">Create a multi-period lease with recurring payouts and continuous protection.</p>

                    <div className="flex gap-2 mt-6">
                        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-amber-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-amber-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 4 ? 'bg-amber-500' : 'bg-neutral-800'}`}></div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex-1">

                        {step === 1 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 1: Parties</CardTitle>
                                    <CardDescription className="text-neutral-400">Identify the lessor and lease context.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="leaseLabel"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-200">Lease Label</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Office Space - 12mo" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Internal reference for this lease.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lessorAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-200">Lessor Wallet Address *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="0x..." className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">The lessor who can claim funds for elapsed periods.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                                <CardFooter className="flex justify-end border-t border-neutral-800 pt-6">
                                    <Button type="button" onClick={handleNextStep1} className="bg-amber-600 hover:bg-amber-700 text-white">
                                        Arbitration Config <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 2 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 2: Arbitration Config</CardTitle>
                                    <CardDescription className="text-neutral-400">Configure dispute resolution for this lease.</CardDescription>
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
                                                <FormDescription className="text-neutral-500 text-xs">Third-party referee for lease disputes. Leave blank if none.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="arbitrationFeeBps"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-300">Arbitration Fee (BPS)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="500" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Fee given to arbiter on dispute, 100 BPS = 1%.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                                <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                    <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-neutral-400">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={handleNextStep2} className="bg-amber-600 hover:bg-amber-700 text-white">
                                        Payment Schedule <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 3 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 3: Payment Schedule</CardTitle>
                                    <CardDescription className="text-neutral-400">Set the lease term, payment intervals, and price per period.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="totalPeriods"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Total Periods *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="12" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Number of recurring payouts.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="periodDurationDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Days per Period *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="30" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">e.g. 30 days = Monthly.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="amountPerPeriod"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-300">Amount per Period (ETH) *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="0.1" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-amber-400/80">Total Required Deposit:</span>
                                            <span className="font-mono font-semibold text-amber-400">{totalETH.toFixed(4)} ETH</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-amber-400/80">Total Lease Duration:</span>
                                            <span className="font-mono font-semibold text-amber-400">{totalDays} days ({Math.round(totalDays / 30)} months)</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                    <Button type="button" variant="ghost" onClick={() => setStep(2)} className="text-neutral-400">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={handleNextStep3} className="bg-amber-600 hover:bg-amber-700 text-white">
                                        Review Deployment <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 4 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 4: Review & Deploy</CardTitle>
                                    <CardDescription className="text-neutral-400">Review your lease setup before deploying on-chain.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-neutral-950/50 rounded-xl border border-neutral-800 p-4 space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Lease:</span>
                                            <span className="font-semibold text-neutral-100">{form.getValues('leaseLabel') || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Lessor:</span>
                                            <span className="font-mono text-amber-400 text-xs">{form.getValues('lessorAddress')}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Arbiter:</span>
                                            <span className="font-mono text-neutral-300 text-xs">{form.getValues('arbiterAddress') || 'None'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Total Commitment</span>
                                                <span className="font-mono text-lg text-emerald-500">{totalETH.toFixed(4)} ETH</span>
                                            </div>
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Lease Term</span>
                                                <span className="font-mono text-lg text-amber-400">{totalDays} days</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="bg-neutral-900 p-2 rounded text-center border border-neutral-800/50">
                                                <span className="text-neutral-500 block">Periods</span>
                                                <span className="text-neutral-200">{form.getValues('totalPeriods')}</span>
                                            </div>
                                            <div className="bg-neutral-900 p-2 rounded text-center border border-neutral-800/50">
                                                <span className="text-neutral-500 block">Per Period</span>
                                                <span className="text-neutral-200">{form.getValues('amountPerPeriod')} ETH</span>
                                            </div>
                                            <div className="bg-neutral-900 p-2 rounded text-center border border-neutral-800/50">
                                                <span className="text-neutral-500 block">Arb Fee</span>
                                                <span className="text-neutral-200">{Number(form.getValues('arbitrationFeeBps')) / 100}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-500/90 text-sm">
                                        <AlertTriangle className="h-5 w-5 shrink-0" />
                                        <div>
                                            <span className="font-semibold block mb-1">Large Lock-Up</span>
                                            You will lock {totalETH.toFixed(4)} ETH for {totalDays} days. The lessor can claim funds as each period elapses.
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
                                    <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-medium" disabled={isPending || isConfirming}>
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
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-400">
                            <FileText className="h-4 w-4" /> Lease Guide
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-neutral-400 space-y-3">
                        <p><strong>Step 1:</strong> Identify the lessor who will receive recurring period payments.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 2:</strong> Set an optional arbiter and the fee charged on disputes.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 3:</strong> Define the number of periods, interval (e.g. 30 days = monthly), and price per period.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 4:</strong> Review and deploy. The total ETH (periods × amount) will be locked upfront.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
