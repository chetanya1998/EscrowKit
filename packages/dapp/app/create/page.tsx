
"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { CreateEscrowWizard } from "@/components/CreateEscrowWizard"

export default function CreateEscrowPage() {
    return (
        <DashboardLayout>
            <div className="mx-auto max-w-4xl py-10 w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-50">Create New Escrow</h1>
                    <p className="text-neutral-400 mt-2">Initialize a trustless payment agreement.</p>
                </div>
                <CreateEscrowWizard />
            </div>
        </DashboardLayout>
    )
}
