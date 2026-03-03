"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, Home, Shield, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"

const templates = [
    {
        id: "freelance",
        title: "Freelance Services",
        description: "Milestone-based escrow for digital work. Payment is released sequentially as milestones are approved.",
        icon: Briefcase,
        bestFor: "Software Development, Design, Writing",
        href: "/create/freelance",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        id: "rental",
        title: "Property Rental",
        description: "Secure long-term deposits with predefined claim windows for landlords and dispute rights for tenants.",
        icon: Home,
        bestFor: "Apartments, Commercial Space, Equipment",
        href: "/create/rental",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        id: "service",
        title: "Service Escrow",
        description: "Fixed-price single delivery services featuring strict deadlines and automated review period releases.",
        icon: Shield,
        bestFor: "Fixed-Price Contracts, Physical Services",
        href: "/create/service",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
    },
    {
        id: "lease",
        title: "Lease Agreements",
        description: "Recurring payout structure tailored for multi-period agreements with continuous lessee protection.",
        icon: FileText,
        bestFor: "Equipment Leasing, Retainers, Subscriptions",
        href: "/create/lease",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
]

export default function TemplatesHub() {
    return (
        <div className="flex flex-col gap-8 mt-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-50 mb-2">Escrow Templates</h1>
                <p className="text-neutral-400 max-w-2xl">
                    Deploy highly secure, specific smart contracts tailored for your real-world use case in seconds.
                    Choose a pre-built template below to get started.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {templates.map((template) => (
                    <Card key={template.id} className="bg-neutral-900 border-neutral-800 flex flex-col hover:border-neutral-700 transition-colors">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className={`p-3 rounded-lg flex items-center justify-center shrink-0 ${template.bg}`}>
                                <template.icon className={`h-6 w-6 ${template.color}`} />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-neutral-50">{template.title}</CardTitle>
                                <CardDescription className="text-neutral-400 mt-1">
                                    {template.description}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between pt-0 mt-4 border-t border-neutral-800 px-6">
                            <div className="py-4">
                                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Best For</span>
                                <p className="text-sm text-neutral-300 mt-1">{template.bestFor}</p>
                            </div>
                            <Link href={template.href} className="w-full">
                                <Button className="w-full bg-white text-black hover:bg-neutral-200 gap-2">
                                    Use Template <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
