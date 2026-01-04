'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '../wagmi'
import * as React from 'react'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {mounted && children}
            </QueryClientProvider>
        </WagmiProvider>
    )
}
