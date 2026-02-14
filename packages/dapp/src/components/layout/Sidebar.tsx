
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Wallet, Gavel, FileText, Settings, ShieldCheck, PlusCircle } from "lucide-react"

const sidebarItems = [
    {
        title: "Create Escrow",
        href: "/create",
        icon: PlusCircle,
    },
    {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "My Escrows",
        href: "/dashboard/escrows",
        icon: Wallet,
    },
    {
        title: "Disputes",
        href: "/dashboard/disputes",
        icon: Gavel,
    },
    {
        title: "Transactions",
        href: "/dashboard/transactions",
        icon: FileText,
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden border-r bg-neutral-950/50 md:block md:w-64 lg:w-72">
            <div className="flex h-full flex-col gap-2">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <ShieldCheck className="h-6 w-6 text-emerald-500" />
                        <span className="text-lg text-neutral-50">EscrowKit</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-4">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        {sidebarItems.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-neutral-50",
                                        pathname === item.href
                                            ? "bg-neutral-800 text-neutral-50"
                                            : "text-neutral-400 hover:bg-neutral-800/50"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <div className="mt-auto border-t p-4">
                    {/* Bottom items like settings can go here */}
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-400 transition-all hover:bg-neutral-800/50 hover:text-neutral-50"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </div>
            </div>
        </div>
    )
}
