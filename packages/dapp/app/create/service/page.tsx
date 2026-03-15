"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
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

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { useRouter } from "next/navigation"
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/lib/constants"

const formSchema = z.object({
    providerAddress: z.string().min(42, "Invalid Ethereum address").max(42, "Invalid Ethereum address"),
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
        resolver: zodResolver(formSchema),
        defaultValues: {
            providerAddress: "",
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
        const arbiter = '0x0000000000000000000000000000000000000000' as `0x${string}`;
        const adapter = '0x0000000000000000000000000000000000000000' as `0x${string}`;
        const token = '0x0000000000000000000000000000000000000000' as `0x${string}`;

        // Convert days to absolute seconds timestamp for deadline
        const deadlineTimestamp = Math.floor(Date.now() / 1000) + (Number(values.deadlineDays) * 86400);
        // Review period is just an interval duration in seconds
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
                    arbitrationFeeBps: BigInt(500), // 5% default
                    reviewPeriod: BigInt(reviewPeriodSeconds),
                    payeePenaltyBps: BigInt(100) // 1% default penalty
                }
            ],
            value: parseEther(values.depositAmount) // Send ETH
        });
    }

    return (
        <div className="max-w-xl mx-auto py-8 px-4">
            <div className="mb-8">
                <Link href="/dashboard/templates" className="text-neutral-500 hover:text-neutral-300 flex items-center gap-2 mb-6 w-fit transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Templates
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-50">Service Contract Template</h1>
                <p className="text-neutral-400 mt-2">Create an escrow with strict delivery deadlines and automated review periods.</p>

                <div className="flex gap-2 mt-6">
                    <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-neutral-800'}`}></div>
                    <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-neutral-800'}`}></div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {step === 1 && (
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <CardTitle className="text-neutral-50">Provider Details</CardTitle>
                                <CardDescription className="text-neutral-400">Specify the address of the service provider.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="providerAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-neutral-200">Provider Wallet Address *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="0x..." className="bg-black/50 border-neutral-800" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-end border-t border-neutral-800 pt-6">
                                <Button
                                    type="button"
                                    onClick={() => form.trigger('providerAddress').then((valid) => valid && setStep(2))}
                                    className="bg-white text-black hover:bg-neutral-200"
                                    disabled={isPending || isConfirming}
                                >
                                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <CardTitle className="text-neutral-50">Contract Configurations</CardTitle>
                                <CardDescription className="text-neutral-400">Set the payment, deadline, and timeframe rules.</CardDescription>
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
                                                <FormLabel className="text-neutral-300">Delivery Deadline *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="7" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Days from deployment to deliver.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="reviewPeriodDays"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-300">Review Period *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="3" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Days client has to approve before auto-release.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {error && (
                                    <div className="text-red-500 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded">
                                        {(error as any).shortMessage || error.message}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-neutral-400" disabled={isPending || isConfirming}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={isPending || isConfirming}>
                                    {isPending || isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isPending ? 'Confirming...' : isConfirming ? 'Deploying...' : 'Deploy Escrow'}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </form>
            </Form>
        </div>
    )
}

