
"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { CreateEscrowWizard } from "@/components/CreateEscrowWizard"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function CreateEscrowPage() {
    return (
        <DashboardLayout>
            <div className="mx-auto max-w-4xl py-10 w-full">
                <div className="mb-8">
                    <Link href="/dashboard/templates" className="text-neutral-500 hover:text-neutral-300 flex items-center gap-2 mb-6 w-fit transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Templates
                    </Link>
                    <h1 className="text-3xl font-bold text-neutral-50">Create New Escrow</h1>
                    <p className="text-neutral-400 mt-2">Initialize a trustless payment agreement.</p>
                </div>
                <CreateEscrowWizard />
            </div>
        </DashboardLayout>
    )
}
