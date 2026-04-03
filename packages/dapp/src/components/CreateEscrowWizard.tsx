'use client'

import Link from 'next/link';
import { ArrowRight, Briefcase, Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function CreateEscrowWizard() {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-neutral-800 bg-neutral-900">
                <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                        <Briefcase className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-neutral-50">Freelance Milestones</CardTitle>
                    <CardDescription className="text-neutral-400">
                        Use the canonical v2 flow to define milestones, choose a token, and deploy a ready-to-fund escrow in one pass.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/create/freelance">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            Open Milestone Builder <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-neutral-900">
                <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <Home className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-neutral-50">Rental Deposits</CardTitle>
                    <CardDescription className="text-neutral-400">
                        Continue through the dedicated rental flow for deposit-specific claims, dispute windows, and review settings.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/create/rental">
                        <Button variant="outline" className="w-full border-neutral-700 bg-neutral-950 text-neutral-200 hover:bg-neutral-800">
                            Open Rental Flow <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
