"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2, ArrowRight, ArrowLeft, Loader2, Shield, AlertTriangle, Briefcase } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { useRouter } from "next/navigation"
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/lib/constants"

const milestoneSchema = z.object({
    description: z.string().min(5, "Description must be at least 5 characters"),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Amount must be a positive number",
    }),
})

const formSchema = z.object({
    freelancerAddress: z.string().min(42, "Invalid Ethereum address").max(42, "Invalid Ethereum address"),
    projectTitle: z.string().optional(),
    milestones: z.array(milestoneSchema).min(1, "At least one milestone is required"),

    arbiterAddress: z.string().optional(),
    arbitrationFeeBps: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10000, {
        message: "Fee must be between 0 and 10000 BPS",
    }),
    payerPenaltyBps: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10000, {
        message: "Penalty must be between 0 and 10000 BPS",
    }),
    payeePenaltyBps: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10000, {
        message: "Penalty must be between 0 and 10000 BPS",
    }),
    disputeWindowDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Dispute window must be 0 or positive",
    }),
    reviewPeriodDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Review period must be 0 or positive",
    }),
})

export default function CreateFreelanceEscrow() {
    const router = useRouter()
    const [step, setStep] = useState(1)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            freelancerAddress: "",
            projectTitle: "",
            milestones: [{ description: "", amount: "" }],
            arbiterAddress: "",
            arbitrationFeeBps: "500",
            payerPenaltyBps: "100",
            payeePenaltyBps: "100",
            disputeWindowDays: "14",
            reviewPeriodDays: "7",
        },
    })

    const { fields, append, remove } = useFieldArray({
        name: "milestones",
        control: form.control,
    })

    const { data: hash, writeContract, isPending, error } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

    useEffect(() => {
        if (isSuccess) {
            router.push('/dashboard/escrows')
        }
    }, [isSuccess, router])

    const totalAmount = form.watch("milestones")?.reduce((sum, m) => sum + (Number(m.amount) || 0), 0) || 0

    function onSubmit(values: z.infer<typeof formSchema>) {
        const arbiter = (values.arbiterAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`;
        const adapter = '0x0000000000000000000000000000000000000000' as `0x${string}`;
        const verificationOracle = '0x0000000000000000000000000000000000000000' as `0x${string}`;

        const amountList = values.milestones.map(m => parseEther(m.amount));
        const descriptionList = values.milestones.map(m => m.description);
        const deadlineList = values.milestones.map(() => BigInt(0));
        const conditionHashList = values.milestones.map(() => "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`);

        const config = {
            arbitrationFeeBps: BigInt(values.arbitrationFeeBps),
            payerPenaltyBps: BigInt(values.payerPenaltyBps),
            payeePenaltyBps: BigInt(values.payeePenaltyBps),
            disputeWindow: BigInt(Number(values.disputeWindowDays) * 86400),
            reviewPeriod: BigInt(Number(values.reviewPeriodDays) * 86400),
        };

        writeContract({
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: 'createEscrow',
            args: [
                values.freelancerAddress as `0x${string}`,
                arbiter,
                adapter,
                "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
                verificationOracle,
                config,
                amountList,
                descriptionList,
                deadlineList,
                conditionHashList,
            ],
            value: parseEther(totalAmount.toString())
        });
    }

    const handleNextStep1 = async () => {
        const isValid = await form.trigger(["freelancerAddress", "projectTitle"]);
        if (isValid) setStep(2);
    }

    const handleNextStep2 = async () => {
        const isValid = await form.trigger("milestones");
        if (isValid) setStep(3);
    }

    const handleNextStep3 = async () => {
        const isValid = await form.trigger(["arbiterAddress", "arbitrationFeeBps", "payerPenaltyBps", "payeePenaltyBps", "disputeWindowDays", "reviewPeriodDays"]);
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
                        Freelance Contract
                        <Badge variant="outline" className="text-blue-400 border-blue-900 bg-blue-900/10">Freelance</Badge>
                    </h1>
                    <p className="text-neutral-400 mt-2">Create a milestone-based escrow agreement for freelance services.</p>

                    <div className="flex gap-2 mt-6">
                        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-blue-500' : 'bg-neutral-800'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 4 ? 'bg-blue-500' : 'bg-neutral-800'}`}></div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex-1">

                        {step === 1 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 1: Counterparty Details</CardTitle>
                                    <CardDescription className="text-neutral-400">Identify the freelancer and scope of work.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="projectTitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-200">Project Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Website Redesign Q4" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Internal reference for this contract.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="freelancerAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-200">Freelancer Wallet Address *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="0x..." className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">The address that will receive payments upon milestone approval.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                                <CardFooter className="flex justify-end border-t border-neutral-800 pt-6">
                                    <Button type="button" onClick={handleNextStep1} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        Define Milestones <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 2 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 2: Milestone Builder</CardTitle>
                                    <CardDescription className="text-neutral-400">Define deliverables and payment amounts per milestone.</CardDescription>
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

                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-400">
                                        Total Contract Value: <strong>{totalAmount.toFixed(4)} ETH</strong> across {fields.length} milestone{fields.length > 1 ? 's' : ''}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                    <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-neutral-400">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={handleNextStep2} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        Arbitration Settings <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 3 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 3: Arbitration & Penalties</CardTitle>
                                    <CardDescription className="text-neutral-400">Configure dispute resolution and penalty parameters.</CardDescription>
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
                                                    <FormDescription className="text-neutral-500 text-xs">100 BPS = 1%.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="reviewPeriodDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Review Period (Days)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="7" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Time client has to review before auto-release.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="payerPenaltyBps"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Client Late Review Penalty (BPS/Day)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="100" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Deducted from client if review is delayed.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="payeePenaltyBps"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-300">Freelancer Late Penalty (BPS/Day)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="100" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-neutral-500 text-xs">Deducted from freelancer if deadline missed.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="disputeWindowDays"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-300">Dispute Window (Days)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="14" type="number" className="bg-black/50 border-neutral-800" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500 text-xs">Time allowed to raise a dispute after milestone delivery.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                                <CardFooter className="flex justify-between border-t border-neutral-800 pt-6">
                                    <Button type="button" variant="ghost" onClick={() => setStep(2)} className="text-neutral-400">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={handleNextStep3} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        Review Deployment <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 4 && (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="text-neutral-50">Step 4: Review & Deploy</CardTitle>
                                    <CardDescription className="text-neutral-400">Review your freelance contract before broadcasting to the blockchain.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-neutral-950/50 rounded-xl border border-neutral-800 p-4 space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Project:</span>
                                            <span className="font-semibold text-neutral-100">{form.getValues('projectTitle') || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Freelancer:</span>
                                            <span className="font-mono text-blue-400 text-xs">{form.getValues('freelancerAddress')}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                            <span className="text-sm text-neutral-400">Arbiter:</span>
                                            <span className="font-mono text-neutral-300 text-xs">{form.getValues('arbiterAddress') || 'None'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Total Value</span>
                                                <span className="font-mono text-lg text-emerald-500">{totalAmount.toFixed(4)} ETH</span>
                                            </div>
                                            <div className="flex flex-col bg-neutral-900 p-3 rounded text-center border border-neutral-800/50">
                                                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Milestones</span>
                                                <span className="font-mono text-lg text-blue-400">{form.getValues('milestones')?.length || 0}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            {form.getValues('milestones')?.map((m, i) => (
                                                <div key={i} className="flex justify-between text-xs bg-neutral-900/50 rounded px-3 py-2 border border-neutral-800/50">
                                                    <span className="text-neutral-400">M{i + 1}: {m.description?.substring(0, 30)}{(m.description?.length || 0) > 30 ? '...' : ''}</span>
                                                    <span className="font-mono text-emerald-400">{Number(m.amount).toFixed(4)} ETH</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="bg-neutral-900 p-2 rounded text-center border border-neutral-800/50">
                                                <span className="text-neutral-500 block">Arb Fee</span>
                                                <span className="text-neutral-200">{Number(form.getValues('arbitrationFeeBps')) / 100}%</span>
                                            </div>
                                            <div className="bg-neutral-900 p-2 rounded text-center border border-neutral-800/50">
                                                <span className="text-neutral-500 block">Review</span>
                                                <span className="text-neutral-200">{form.getValues('reviewPeriodDays')}d</span>
                                            </div>
                                            <div className="bg-neutral-900 p-2 rounded text-center border border-neutral-800/50">
                                                <span className="text-neutral-500 block">Dispute</span>
                                                <span className="text-neutral-200">{form.getValues('disputeWindowDays')}d</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-500/90 text-sm">
                                        <AlertTriangle className="h-5 w-5 shrink-0" />
                                        <div>
                                            <span className="font-semibold block mb-1">Irreversible Blockchain Action</span>
                                            Review the contract terms carefully. Once deployed, the milestone structure and funding cannot be unilaterally modified.
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
                                    <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-medium" disabled={isPending || isConfirming}>
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
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-400">
                            <Briefcase className="h-4 w-4" /> Freelance Guide
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-neutral-400 space-y-3">
                        <p><strong>Step 1:</strong> Identify the freelancer who will receive milestone payments.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 2:</strong> Break your project into deliverable milestones with individual ETH payments.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 3:</strong> Set penalties for late delivery or delayed reviews, and configure an arbiter for dispute resolution.</p>
                        <Separator className="bg-neutral-800" />
                        <p><strong>Step 4:</strong> Review everything and deploy. The total ETH across all milestones will be locked in the contract.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
