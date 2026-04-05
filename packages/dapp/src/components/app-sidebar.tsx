"use client"

import { Home, LayoutTemplate, History, Settings, Briefcase, AlertTriangle, Code, Webhook } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
} from "@/components/ui/sidebar"

// Menu items grouped by Roles
const userItems = [
    {
        title: "Overview",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "My Escrows",
        url: "/dashboard/escrows",
        icon: Briefcase,
    },
    {
        title: "Transactions",
        url: "/dashboard/transactions",
        icon: History,
    },
    {
        title: "Disputes",
        url: "/dashboard/disputes",
        icon: AlertTriangle,
    },
]

const adminItems = [
    {
        title: "Developer Platform",
        url: "/dashboard/platform",
        icon: Webhook,
    },
    {
        title: "Templates",
        url: "/dashboard/templates",
        icon: LayoutTemplate,
    },
    {
        title: "Contracts",
        url: "/dashboard/contracts",
        icon: Code,
    },
]

const superAdminItems = [
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
]

export function AppSidebar() {
    const pathname = usePathname();

    const basePath = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'gh-pages' ? '/EscrowKit' : '';

    return (
        <Sidebar variant="inset">
            <SidebarHeader className="border-b p-4">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${basePath}/escrowkit-logo.png`} alt="EscrowKit" width={28} height={28} className="shrink-0" />
                    <span className="text-xl font-bold">EscrowKit</span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>User Area</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {userItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url || pathname.startsWith(item.url + '/') && item.url !== '/dashboard'}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Developer Console</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title} isActive={pathname?.startsWith(item.url)}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {superAdminItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title} isActive={pathname?.startsWith(item.url)}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t">
                {/* Could add user profile / connect wallet mini view here */}
                <div className="text-xs text-muted-foreground text-center">
                    EscrowKit v1.0
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
