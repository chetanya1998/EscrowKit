"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"

const milestoneSchema = z.object({
    description: z.string().min(5, "Description must be at least 5 characters"),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Amount must be a positive number",
    }),
})

const formSchema = z.object({
    freelancerAddress: z.string().min(42, "Invalid Ethereum address").max(42, "Invalid Ethereum address"),
    arbiterAddress: z.string().optional(),
    milestones: z.array(milestoneSchema).min(1, "At least one milestone is required"),
})

export default function CreateFreelanceEscrow() {
    const [step, setStep] = useState(1)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            freelancerAddress: "",
            arbiterAddress: "",
            milestones: [{ description: "", amount: "" }],
        },
    })

    const { fields, append, remove } = useFieldArray({
        name: "milestones",
        control: form.control,
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        // Implementation for smart contract deployment here...
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <Link href="/dashboard/templates" className="text-neutral-500 hover:text-neutral-300 flex items-center gap-2 mb-6 w-fit transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Templates
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-50">Freelance Contract Template</h1>
                <p className="text-neutral-400 mt-2">Create a milestone-based escrow agreement for freelance services.</p>

                <div className="flex gap-2 mt-6">
                    <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-neutral-800'}`}></div>
                    <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-neutral-800'}`}></div>
                    <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-blue-500' : 'bg-neutral-800'}`}></div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {step === 1 && (
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <CardTitle className="text-neutral-50">Counterparty Details</CardTitle>
                                <CardDescription className="text-neutral-400">Enter the wallet addresses for this agreement.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="freelancerAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-neutral-200">Freelancer Wallet Address *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="0x..." className="bg-black/50 border-neutral-800" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-neutral-500">The address that will receive payments upon milestone approval.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-end border-t border-neutral-800 pt-6">
                                <Button
                                    type="button"
                                    onClick={() => form.trigger('freelancerAddress').then((valid) => valid && setStep(2))}
                                    className="bg-white text-black hover:bg-neutral-200"
                                >
                                    Continue to Milestones <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <CardTitle className="text-neutral-50">Milestone Builder</CardTitle>
                                <CardDescription className="text-neutral-400">Define the deliverables and payment schedule.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 border border-neutral-800 rounded-lg space-y-4 bg-black/20 relative">
                                        {index > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <h4 className="font-medium text-blue-400 text-sm">Milestone {index + 1}</h4>

                                        <FormField
                                            control={form.control}
                                            name={`milestones.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Deliverable Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="e.g. Completed initial design mockups" className="bg-black/50 border-neutral-800 resize-none" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`milestones.${index}.amount`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Payment Amount (ETH)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="0.5" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-dashed border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 text-neutral-400"
                                    onClick={() => append({ description: "", amount: "" })}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Another Milestone
                                </Button>

                            </CardContent>
                            <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-neutral-400">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => form.trigger('milestones').then((valid) => valid && setStep(3))}
                                    className="bg-white text-black hover:bg-neutral-200"
                                >
                                    Continue to Review <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {step === 3 && (
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader>
                                <CardTitle className="text-neutral-50">Advanced Settings (Optional)</CardTitle>
                                <CardDescription className="text-neutral-400">Configure dispute resolution arbitration.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="arbiterAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-neutral-200">Arbiter Contract/Wallet Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="0x... (Optional)" className="bg-black/50 border-neutral-800" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-neutral-500">Leaving this blank means no 3rd-party arbitration will be available.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                <Button type="button" variant="ghost" onClick={() => setStep(2)} className="text-neutral-400">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                                    Deploy Smart Contract
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                </form>
            </Form>
        </div>
    )
}
