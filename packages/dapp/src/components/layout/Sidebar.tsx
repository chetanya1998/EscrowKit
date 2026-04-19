
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Wallet, Gavel, FileText, Settings, PlusCircle, Code2, BookOpen, Terminal } from "lucide-react"

const sidebarItems = [
    {
        title: "Create Escrow",
        href: "/create",
        icon: PlusCircle,
    },
    {
        title: "Custom Builder",
        href: "/create/custom",
        icon: FileText,
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
    {
        title: "Documentation",
        href: "/dashboard/docs",
        icon: BookOpen,
        isHeader: true,
    },
    {
        title: "SDK Reference",
        href: "/dashboard/docs/sdk",
        icon: Terminal,
    },
    {
        title: "API Reference",
        href: "/dashboard/docs/api",
        icon: Code2,
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden border-r bg-neutral-950/50 md:block md:w-64 lg:w-72">
            <div className="flex h-full flex-col gap-2">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                            <path d="M20 2L4 9v10c0 9.4 6.8 18.2 16 20.4C29.2 37.2 36 28.4 36 19V9L20 2z" fill="#10b981" />
                            <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="system-ui, sans-serif">EK</text>
                        </svg>
                        <span className="text-lg text-neutral-50">EscrowKit</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-4">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        {sidebarItems.map((item: any, index) => {
                            const Icon = item.icon
                            
                            if (item.isHeader) {
                                return (
                                    <div id="sidebar-docs" key={index} className="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                        {item.title}
                                    </div>
                                )
                            }

                            return (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-neutral-50",
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
