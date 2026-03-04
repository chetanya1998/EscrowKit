"use client"

import { Shield, Home, LayoutTemplate, History, Settings, FileText } from "lucide-react"
import Link from "next/link"

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

// Menu items.
const items = [
    {
        title: "Home",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Templates",
        url: "/dashboard/templates",
        icon: LayoutTemplate,
    },
    {
        title: "Active Escrows",
        url: "/dashboard/escrows",
        icon: Shield,
    },
    {
        title: "Disputes",
        url: "/dashboard/disputes",
        icon: FileText,
    },
    {
        title: "Transactions",
        url: "/dashboard/transactions",
        icon: History,
    },
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
]

export function AppSidebar() {
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
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
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
