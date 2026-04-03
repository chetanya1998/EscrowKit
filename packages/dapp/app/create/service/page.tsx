"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowRight, ArrowLeft, Loader2, Shield, AlertTriangle, Wrench } from "lucide-react"
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
    providerAddress: z.string().min(42, "Invalid Ethereum address").max(42, "Invalid Ethereum address"),
    serviceDescription: z.string().optional(),

    arbiterAddress: z.string().optional(),
    arbitrationFeeBps: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10000, {
        message: "Fee must be between 0 and 10000 BPS",
    }),
    payeePenaltyBps: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10000, {
        message: "Penalty must be between 0 and 10000 BPS",
    }),

    depositAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Amount must be a positive number",
    }),
    deadlineDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: "Deadline must be at least 1 day in the future",
    }),
    reviewPeriodDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: "Review period must be at least 1 day",
    }),
})

export default function CreateServiceEscrow() {
    const router = useRouter()
    const [step, setStep] = useState(1)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema as any),
        defaultValues: {
            providerAddress: "",
            serviceDescription: "",
            arbiterAddress: "",
            arbitrationFeeBps: "500",
            payeePenaltyBps: "100",
            depositAmount: "",
            deadlineDays: "7",
            reviewPeriodDays: "3",
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
        const adapter = '0x0000000000000000000000000000000000000000' as `0x${string}`;
        const token = '0x0000000000000000000000000000000000000000' as `0x${string}`;

        const deadlineTimestamp = Math.floor(Date.now() / 1000) + (Number(values.deadlineDays) * 86400);
        const reviewPeriodSeconds = Number(values.reviewPeriodDays) * 86400;

        writeContract({
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: 'createServiceEscrow',
            args: [
                values.providerAddress as `0x${string}`,
                arbiter,
                adapter,
                token,
                parseEther(values.depositAmount),
                BigInt(deadlineTimestamp),
                {
                    arbitrationFeeBps: BigInt(values.arbitrationFeeBps),
                    reviewPeriod: BigInt(reviewPeriodSeconds),
                    payeePenaltyBps: BigInt(values.payeePenaltyBps),
                }
            ],
            value: parseEther(values.depositAmount)
        });
    }

    const handleNextStep1 = async () => {
        const isValid = await form.trigger(["providerAddress", "serviceDescription"]);
        if (isValid) setStep(2);
    }

    const handleNextStep2 = async () => {
        const isValid = await form.trigger(["arbiterAddress", "arbitrationFeeBps", "payeePenaltyBps"]);
        if (isValid) setStep(3);
    }

    const handleNextStep3 = async () => {
        const isValid = await form.trigger(["depositAmount", "deadlineDays", "reviewPeriodDays"]);
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
                        Service Contract
                        <Badge variant="outline" className="text-purple-400 border-purple-900 bg-purple-900/10">Service</Badge>
                    </h1>
                    <p className="text-neutral-400 mt-2">Create an escrow with strict delivery deadlines and automated review period releases.</p>

                    <div className="flex gap-2 mt-6">
                        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-purple-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 4 ? 'bg-purple-500' : 'bg-neutral-800'}`}></div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex-1">

                        {step === 1 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 1: Parties</CardTitle>
                                    <CardDescription className="text-neutral-400">Identify the service provider and scope.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="serviceDescription"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-200">Service Description</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Full Home Renovation" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Brief description for internal reference.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="providerAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-200">Provider Wallet Address *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="0x..." className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">The service provider who will deliver the work and receive payment.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                                <CardFooter className="flex justify-end border-t border-neutral-800 pt-6">
                                    <Button type="button" onClick={handleNextStep1} className="bg-purple-600 hover:bg-purple-700 text-white">
                                        Arbitration Config <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 2 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 2: Arbitration & Penalties</CardTitle>
                                    <CardDescription className="text-neutral-400">Configure dispute resolution and late penalties.</CardDescription>
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
                                                <FormDescription className="text-neutral-500 text-xs">Third-party referee for disputes. Leave blank for no arbitration.</FormDescription>
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
                                                    <FormDescription className="text-neutral-500 text-xs">Fee for arbiter, 100 BPS = 1%.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="payeePenaltyBps"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Provider Late Penalty (BPS)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="100" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Penalty if provider misses the delivery deadline.</FormDescription>
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
                                    <Button type="button" onClick={handleNextStep2} className="bg-purple-600 hover:bg-purple-700 text-white">
                                        Contract Terms <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 3 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 3: Contract Terms</CardTitle>
                                    <CardDescription className="text-neutral-400">Set the payment amount, delivery deadline, and review period.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="depositAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-300">Contract Value (ETH) *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="1.0" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Total payment locked in escrow for this service.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="deadlineDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Delivery Deadline (Days) *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="7" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Days from deployment to deliver the service.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="reviewPeriodDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Review Period (Days) *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="3" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Days client has to approve before auto-release.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                    <Button type="button" variant="ghost" onClick={() => setStep(2)} className="text-neutral-400">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={handleNextStep3} className="bg-purple-600 hover:bg-purple-700 text-white">
                                        Review Deployment <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 4 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 4: Review & Deploy</CardTitle>
                                    <CardDescription className="text-neutral-400">Review your service contract before deploying on-chain.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-neutral-950/50 rounded-xl border border-neutral-800 p-4 space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Service:</span>
                                            <span className="font-semibold text-neutral-100">{form.getValues('serviceDescription') || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Provider:</span>
                                            <span className="font-mono text-purple-400 text-xs">{form.getValues('providerAddress')}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Arbiter:</span>
                                            <span className="font-mono text-neutral-300 text-xs">{form.getValues('arbiterAddress') || 'None'}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Value</span>
                                                <span className="font-mono text-lg text-emerald-500">{form.getValues('depositAmount')} ETH</span>
                                            </div>
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Deadline</span>
                                                <span className="font-mono text-lg text-purple-400">{form.getValues('deadlineDays')} days</span>
                                            </div>
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Review</span>
                                                <span className="font-mono text-lg text-purple-400">{form.getValues('reviewPeriodDays')} days</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-neutral-900 p-2 rounded text-center border border-neutral-800/50">
                                                <span className="text-neutral-500 block">Arb Fee</span>
                                                <span className="text-neutral-200">{Number(form.getValues('arbitrationFeeBps')) / 100}%</span>
                                            </div>
                                            <div className="bg-neutral-900 p-2 rounded text-center border border-neutral-800/50">
                                                <span className="text-neutral-500 block">Late Penalty</span>
                                                <span className="text-neutral-200">{Number(form.getValues('payeePenaltyBps')) / 100}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {Number(form.getValues('payeePenaltyBps')) > 0 && (
                                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3 text-rose-400 text-sm">
                                            <AlertTriangle className="h-5 w-5 shrink-0" />
                                            <p>If the provider misses the {form.getValues('deadlineDays')}-day deadline, a {Number(form.getValues('payeePenaltyBps')) / 100}% penalty will be deducted from the payout.</p>
                                        </div>
                                    )}

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
                                    <Button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white font-medium" disabled={isPending || isConfirming}>
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
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-400">
                            <Wrench className="h-4 w-4" /> Service Guide
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-neutral-400 space-y-3">
                        <p><strong>Step 1:</strong> Identify the service provider who will deliver the work.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 2:</strong> Set an optional arbiter and penalty rates for late delivery.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 3:</strong> Define the contract value, delivery deadline, and review period before auto-release.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 4:</strong> Review everything and deploy. The ETH will be locked until the service is delivered and reviewed.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
