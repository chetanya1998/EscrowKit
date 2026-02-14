
"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import Link from 'next/link'
import { User, LogOut, Settings, Copy, Wallet, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Header() {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()

    const handleConnect = () => {
        if (!isConnected) {
            connect({ connector: injected() })
        }
    }

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address)
            toast.success("Address copied to clipboard")
        }
    }

    return (
        <header className="flex h-16 items-center gap-4 border-b bg-neutral-950/50 px-6">
            <div className="w-full flex-1">
                <form>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                        <Input
                            type="search"
                            placeholder="Find escrow by address or ID..."
                            className="w-full bg-neutral-900 pl-9 md:w-[300px] lg:w-[400px] border-neutral-800 focus-visible:ring-neutral-700"
                        />
                    </div>
                </form>
            </div>
            <div className="flex items-center gap-4">
                {isConnected ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                            >
                                <Wallet className="mr-2 h-4 w-4" />
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800 text-neutral-200">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-neutral-800" />
                            <DropdownMenuItem className="focus:bg-neutral-800 focus:text-neutral-50 cursor-pointer" onClick={copyAddress}>
                                <Copy className="mr-2 h-4 w-4" />
                                <span>Copy Address</span>
                            </DropdownMenuItem>
                            <Link href="/dashboard/settings">
                                <DropdownMenuItem className="focus:bg-neutral-800 focus:text-neutral-50 cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator className="bg-neutral-800" />
                            <DropdownMenuItem className="focus:bg-neutral-800 focus:text-red-400 text-red-500 cursor-pointer" onClick={() => disconnect()}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Disconnect</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button
                        className="rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                        onClick={handleConnect}
                    >
                        Connect Wallet
                    </Button>
                )}
            </div>
        </header>
    )
}
