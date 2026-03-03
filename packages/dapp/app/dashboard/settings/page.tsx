
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "@/components/settings/profile-form"
import { DeveloperSettings } from "@/components/settings/developer-settings"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
    return (
        
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-neutral-50">Settings</h3>
                    <p className="text-sm text-neutral-400">
                        Manage your account settings and preferences.
                    </p>
                </div>
                <Separator className="bg-neutral-800" />
                <Tabs defaultValue="profile" className="space-y-4">
                    <TabsList className="bg-neutral-900 border border-neutral-800">
                        <TabsTrigger value="profile" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-50 text-neutral-400">
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="account" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-50 text-neutral-400">
                            Account
                        </TabsTrigger>
                        <TabsTrigger value="developers" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-50 text-neutral-400">
                            Developers
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="space-y-4">
                        <ProfileForm />
                    </TabsContent>
                    <TabsContent value="account">
                        <div className="text-neutral-500">Account settings coming soon...</div>
                    </TabsContent>
                    <TabsContent value="notifications">
                        <div className="text-neutral-500">Notification preferences coming soon...</div>
                    </TabsContent>
                    <TabsContent value="developers">
                        <DeveloperSettings />
                    </TabsContent>
                </Tabs>
            </div>
        
    )
}
