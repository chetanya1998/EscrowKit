'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, useAccount } from 'wagmi'
import { RainbowKitProvider, darkTheme, RainbowKitAuthenticationProvider, AuthenticationStatus } from '@rainbow-me/rainbowkit'
import { config } from '../wagmi'
import * as React from 'react'
import { authAdapter } from '../lib/authAdapter'
import { API_BASE_URL, AUTH_CHANGED_EVENT, getStoredAuthToken, clearStoredAuthToken } from '../lib/utils'
import { PlatformProvider } from '../contexts/PlatformContext'

const queryClient = new QueryClient()

function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { address, isConnected } = useAccount()
    const [authStatus, setAuthStatus] = React.useState<AuthenticationStatus>('loading')
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    React.useEffect(() => {
        let cancelled = false

        async function validateSession() {
            const token = getStoredAuthToken()

            if (!token || !isConnected || !address) {
                if (!cancelled) setAuthStatus('unauthenticated')
                return
            }

            setAuthStatus('loading')

            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/auth/session`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (!response.ok) {
                    clearStoredAuthToken()
                    if (!cancelled) setAuthStatus('unauthenticated')
                    return
                }

                const data = await response.json()
                const isSameWallet =
                    data.walletAddress?.toLowerCase() === address.toLowerCase()

                if (!isSameWallet) {
                    clearStoredAuthToken()
                    if (!cancelled) setAuthStatus('unauthenticated')
                    return
                }

                if (!cancelled) setAuthStatus('authenticated')
            } catch {
                clearStoredAuthToken()
                if (!cancelled) setAuthStatus('unauthenticated')
            }
        }

        validateSession()

        const handleAuthChange = () => {
            validateSession()
        }

        window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange)

        return () => {
            cancelled = true
            window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange)
        }
    }, [address, isConnected])

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
                    <PlatformProvider>
                        {children}
                    </PlatformProvider>
                </AuthWrapper>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
