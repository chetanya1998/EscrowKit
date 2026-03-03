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
    landlordAddress: z.string().min(42, "Invalid Ethereum address").max(42, "Invalid Ethereum address"),
    depositAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Deposit amount must be a positive number",
    }),
    claimWindowDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: "Claim window must be at least 1 day",
    }),
})

export default function CreateRentalEscrow() {
    const [step, setStep] = useState(1)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            landlordAddress: "",
            depositAmount: "",
            claimWindowDays: "14",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        // Implementation for RentalEscrow deployment here...
    }

    return (
        <div className="max-w-xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-50">Property Rental Template</h1>
                <p className="text-neutral-400 mt-2">Deploy a secure deposit escrow for rentals.</p>

                <div className="flex gap-2 mt-6">
                    <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-neutral-800'}`}></div>
                    <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-neutral-800'}`}></div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {step === 1 && (
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <CardTitle className="text-neutral-50">Landlord Details</CardTitle>
                                <CardDescription className="text-neutral-400">Specify the landlord receiving the deposit claim rights.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="landlordAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-neutral-200">Landlord Wallet Address *</FormLabel>
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
                                    onClick={() => form.trigger('landlordAddress').then((valid) => valid && setStep(2))}
                                    className="bg-white text-black hover:bg-neutral-200"
                                >
                                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <CardTitle className="text-neutral-50">Deposit Parameters</CardTitle>
                                <CardDescription className="text-neutral-400">Configure the deposit amounts and claim windows.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="depositAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-neutral-300">Vault Deposit Amount (ETH) *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="1.5" className="bg-black/50 border-neutral-800" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-neutral-500">The tenant will be required to fund this specific exact amount.</FormDescription>
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
                                            <FormDescription className="text-neutral-500">Duration landlord has to file for damages after lease termination before tenant can auto-withdraw.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-neutral-400">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
