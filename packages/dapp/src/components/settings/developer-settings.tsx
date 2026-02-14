
"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, Copy, Trash, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface ApiKey {
    id: string
    name: string
    key: string
    createdAt: string
}

interface Stats {
    totalVolume: string
    activeEscrows: number
    completedEscrows: number
    disputeCount: number
    escrowCount: number
}

export function DeveloperSettings() {
    const { address } = useAccount()
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [newKeyName, setNewKeyName] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (address) {
            fetchKeys()
            fetchStats()
        }
    }, [address])

    const fetchKeys = async () => {
        if (!address) return
        try {
            const res = await fetch(`http://localhost:3001/users/${address}/keys`)
            if (res.ok) {
                const data = await res.json()
                setKeys(data)
            }
        } catch (error) {
            console.error("Failed to fetch keys", error)
        }
    }

    const fetchStats = async () => {
        if (!address) return
        try {
            const res = await fetch(`http://localhost:3001/users/${address}/analytics`)
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error("Failed to fetch stats", error)
        }
    }

    const generateKey = async () => {
        if (!address || !newKeyName) return
        setLoading(true)
        try {
            const res = await fetch(`http://localhost:3001/users/${address}/keys`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newKeyName })
            })
            if (res.ok) {
                toast.success("API Key Generated")
                setNewKeyName("")
                fetchKeys()
            } else {
                toast.error("Failed to generate key")
            }
        } catch (error) {
            toast.error("Error generating key")
        } finally {
            setLoading(false)
        }
    }

    const revokeKey = async (keyId: string) => {
        if (!address) return
        try {
            const res = await fetch(`http://localhost:3001/users/${address}/keys/${keyId}`, {
                method: "DELETE"
            })
            if (res.ok) {
                toast.success("API Key Revoked")
                fetchKeys()
            }
        } catch (error) {
            toast.error("Error revoking key")
        }
    }

    const copyKey = (key: string) => {
        navigator.clipboard.writeText(key)
        toast.success("Key copied to clipboard")
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-200">Total Volume</CardTitle>
                        <RefreshCw className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-50">{stats?.totalVolume || "0"} ETH</div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-200">Active Escrows</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-50">{stats?.activeEscrows || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-200">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-50">{stats?.completedEscrows || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-200">Disputes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-50">{stats?.disputeCount || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-neutral-50">API Keys</CardTitle>
                    <CardDescription className="text-neutral-400">
                        Manage your API keys for external integrations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Key Name (e.g. Website Integration)"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            className="bg-neutral-950 border-neutral-800 text-neutral-50"
                        />
                        <Button onClick={generateKey} disabled={loading || !newKeyName} className="bg-emerald-500 hover:bg-emerald-600 text-black">
                            {loading ? "Generating..." : "Generate Key"}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {keys.map((key) => (
                            <div key={key.id} className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 bg-neutral-950/50">
                                <div className="space-y-1">
                                    <p className="font-medium text-neutral-50">{key.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-neutral-400 font-mono bg-black/30 px-2 py-1 rounded">
                                        <Key className="h-3 w-3" />
                                        {key.key}
                                    </div>
                                    <p className="text-xs text-neutral-500">Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => copyKey(key.key)} className="hover:text-emerald-400">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => revokeKey(key.id)} className="hover:text-red-400 text-red-500/50">
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {keys.length === 0 && (
                            <div className="text-center py-8 text-neutral-500">
                                No API keys generated yet.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
