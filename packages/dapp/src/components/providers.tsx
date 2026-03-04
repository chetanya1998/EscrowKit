'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, useAccount } from 'wagmi'
import { RainbowKitProvider, darkTheme, RainbowKitAuthenticationProvider, AuthenticationStatus } from '@rainbow-me/rainbowkit'
import { config } from '../wagmi'
import * as React from 'react'
import { authAdapter } from '../lib/authAdapter'

const queryClient = new QueryClient()

function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { isConnected } = useAccount()
    const [authStatus, setAuthStatus] = React.useState<AuthenticationStatus>('loading')
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        const token = localStorage.getItem('authToken')
        if (token && isConnected) {
            setAuthStatus('authenticated')
        } else {
            setAuthStatus('unauthenticated')
        }
    }, [isConnected])

    return (
        <RainbowKitAuthenticationProvider
            adapter={authAdapter}
            status={authStatus}
        >
            <RainbowKitProvider theme={darkTheme()}>
                {mounted && children}
            </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
    )
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <AuthWrapper>
                    {children}
                </AuthWrapper>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
