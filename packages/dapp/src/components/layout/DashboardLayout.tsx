'use client';

import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useAuth } from "@/hooks/useAuth"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, isLoading } = useAuth();
    const { isConnected } = useAccount();
    const router = useRouter();

    useEffect(() => {
        // Allow access if authenticated via JWT OR wallet connected
        if (!isLoading && !isAuthenticated && !isConnected) {
            router.push('/auth/login');
        }
    }, [isLoading, isAuthenticated, isConnected, router]);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    // If not auth'd and not wallet connected, don't render (redirect above will handle)
    if (!isAuthenticated && !isConnected) {
        return null;
    }

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-black text-foreground">
            <Sidebar />
            <div className="flex flex-col">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-black">
                    {children}
                </main>
            </div>
        </div>
    )
}

