"use client"

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <h1 className="font-semibold text-lg hidden sm:block">Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <ConnectButton />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
