'use client'

import React from 'react';
import { CreateEscrowWizard } from '@/components/CreateEscrowWizard';

export default function CreateEscrow() {
    return (
        <div className="container mx-auto py-20">
            <h1 className="text-3xl font-bold mb-8 text-center">Create New Escrow</h1>
            <CreateEscrowWizard />
        </div>
    );
}
