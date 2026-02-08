
"use client"

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function Header() {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()

    const handleConnect = () => {
        if (isConnected) {
            disconnect()
        } else {
            connect({ connector: injected() })
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
                <Button
                    className="rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                    onClick={handleConnect}
                >
                    {isConnected
                        ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
                        : "Connect Wallet"
                    }
                </Button>
            </div>
        </header>
    )
}
