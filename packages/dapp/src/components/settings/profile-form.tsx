
"use client"

import { useState, useEffect } from "react"
import { useSettings, UserProfile } from "@/hooks/useSettings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "../ui/label"
import { Loader2 } from "lucide-react"

export function ProfileForm() {
    const { profile, updateProfile, isUpdating, isLoading } = useSettings()
    const [formData, setFormData] = useState<Partial<UserProfile>>({})

    useEffect(() => {
        if (profile) {
            setFormData({
                username: profile.username || "",
                email: profile.email || "",
                bio: profile.bio || "",
            })
        }
    }, [profile])


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateProfile(formData)
    }

    if (isLoading) {
        return <div className="p-8 text-center text-neutral-500">Loading profile...</div>
    }

    return (
        <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
                <CardTitle className="text-neutral-50">Profile Details</CardTitle>
                <CardDescription className="text-neutral-400">
                    This information will be displayed publicly on your escrow contracts.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-neutral-300">Username</Label>
                        <Input
                            id="username"
                            name="username"
                            placeholder="e.g. Satoshi Nakamoto"
                            value={formData.username || ""}
                            onChange={handleChange}
                            className="bg-neutral-950 border-neutral-800 text-neutral-50 focus-visible:ring-emerald-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-neutral-300">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="e.g. satoshi@bitcoin.org"
                            value={formData.email || ""}
                            onChange={handleChange}
                            className="bg-neutral-950 border-neutral-800 text-neutral-50 focus-visible:ring-emerald-500"
                        />
                        <p className="text-[0.8rem] text-neutral-500">
                            We'll use this for important notifications about your escrows.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio" className="text-neutral-300">Bio</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            placeholder="Tell us a little about yourself"
                            className="min-h-[100px] bg-neutral-950 border-neutral-800 text-neutral-50 focus-visible:ring-emerald-500"
                            value={formData.bio || ""}
                            onChange={handleChange}
                        />
                    </div>
                </CardContent>
                <CardFooter className="border-t border-neutral-800 px-6 py-4">
                    <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold" disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
