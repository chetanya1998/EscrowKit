"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowRight, ArrowLeft } from "lucide-react"

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

const formSchema = z.object({
    lessorAddress: z.string().min(42, "Invalid Ethereum address").max(42, "Invalid Ethereum address"),
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
    const [step, setStep] = useState(1)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            lessorAddress: "",
            totalPeriods: "12",
            periodDurationDays: "30",
            amountPerPeriod: "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        // Implementation for LeaseEscrow deployment here...
    }

    return (
        <div className="max-w-xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-50">Lease Agreement Template</h1>
                <p className="text-neutral-400 mt-2">Create a multi-period lease with recurring payouts and continuous protection.</p>

                <div className="flex gap-2 mt-6">
                    <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-amber-500' : 'bg-neutral-800'}`}></div>
                    <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-neutral-800'}`}></div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {step === 1 && (
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <CardTitle className="text-neutral-50">Lessor Details</CardTitle>
                                <CardDescription className="text-neutral-400">Specify the address receiving the lease payments.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="lessorAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-neutral-200">Lessor Wallet Address *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="0x..." className="bg-black/50 border-neutral-800" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-neutral-500">The address that can claim funds for elapsed periods.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-end border-t border-neutral-800 pt-6">
                                <Button
                                    type="button"
                                    onClick={() => form.trigger('lessorAddress').then((valid) => valid && setStep(2))}
                                    className="bg-white text-black hover:bg-neutral-200"
                                >
                                    Configure Schedule <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <CardTitle className="text-neutral-50">Payment Schedule</CardTitle>
                                <CardDescription className="text-neutral-400">Set the total lease term, interval duration, and price per period.</CardDescription>
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
                                                <FormDescription className="text-neutral-500 text-xs">Number of times the lessor will be paid.</FormDescription>
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
                                                <FormDescription className="text-neutral-500 text-xs">Duration between each claim window (e.g. 30 days = Monthly).</FormDescription>
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
                                            <FormDescription className="text-neutral-500">
                                                Total Required Deposit will be:
                                                <strong className="text-amber-500 ml-1 block mt-1 text-base">
                                                    {form.watch('totalPeriods') && form.watch('amountPerPeriod') && !isNaN(Number(form.watch('amountPerPeriod')))
                                                        ? (Number(form.watch('totalPeriods')) * Number(form.watch('amountPerPeriod'))).toFixed(4)
                                                        : "0.0000"} ETH
                                                </strong>
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-neutral-400">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white">
                                    Deploy Escrow
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </form>
            </Form>
        </div>
    )
}
