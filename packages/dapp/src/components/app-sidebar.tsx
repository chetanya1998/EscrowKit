"use client"

import { Shield, Home, LayoutTemplate, History, Settings, FileText, UserCircle, Briefcase, Lock, AlertTriangle } from "lucide-react"
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
        title: "Templates",
        url: "/dashboard/templates",
        icon: LayoutTemplate,
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

    return (
        <Sidebar variant="inset">
            <SidebarHeader className="border-b p-4">
                <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold font-outfit">EscrowKit</span>
                </div>
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
                    <SidebarGroupLabel>Marketplace Integrators</SidebarGroupLabel>
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
