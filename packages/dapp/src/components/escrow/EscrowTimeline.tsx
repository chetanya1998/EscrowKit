import React from 'react';
import { Check, Clock, Play, Lock, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Milestone } from '@/hooks/useEscrow';

export interface TimelineStep {
    label: string;
    description?: string;
    status: 'completed' | 'current' | 'upcoming' | 'error';
    date?: string; // e.g. "Oct 24, 2023, 10:00 AM"
}

interface EscrowTimelineProps {
    type: 'milestone' | 'rental' | 'service' | 'lease' | 'b2b-vendor';
    statusValue?: number;
    milestones?: Milestone[];
    // We optionally accept timestamps down the line, but for now we provide mock or generated placeholders
    // to demonstrate the feature's capability for time-based tracking.
    createdAt?: string; 
    updatedAt?: string;
}

export function EscrowTimeline({ type, statusValue, milestones, createdAt, updatedAt }: EscrowTimelineProps) {
    let steps: TimelineStep[] = [];

    // Fallback mock dates if none provided
    const defaultStart = createdAt || 'Oct 25, 2023, 10:00 AM';
    const defaultUpdate = updatedAt || 'Oct 26, 2023, 02:15 PM';

    if (type === 'service') {
        const status = statusValue ?? 0;
        steps = [
            { label: 'Escrow Initialized', status: 'completed', date: defaultStart },
            { 
                label: 'Awaiting Deposit', 
                status: status === 0 ? 'current' : (status > 0 ? 'completed' : 'upcoming'), 
                date: status > 0 ? defaultUpdate : undefined 
            },
            { 
                label: 'Work in Progress', 
                status: status === 1 ? 'current' : (status > 1 ? 'completed' : 'upcoming') 
            },
            { 
                label: 'In Review', 
                status: status === 2 ? 'current' : (status > 2 && status !== 5 && status !== 6 ? 'completed' : 'upcoming') 
            },
            { 
                label: 'Payment Released', 
                status: status === 4 ? 'completed' : 'upcoming' 
            }
        ];
        if (status === 6) {
            steps.push({ label: 'Disputed', status: 'error', description: 'Arbiter is reviewing the case.', date: defaultUpdate });
        } else if (status === 5) {
            steps.push({ label: 'Refunded', status: 'completed', date: defaultUpdate });
        }
    } else if (type === 'rental') {
        const status = statusValue ?? 0;
        steps = [
            { label: 'Rental Agreement Created', status: 'completed', date: defaultStart },
            { 
                label: 'Awaiting Security Deposit', 
                status: status === 0 ? 'current' : (status > 0 ? 'completed' : 'upcoming'), 
                date: status > 0 ? defaultUpdate : undefined 
            },
            { 
                label: 'Active Lease', 
                status: status === 1 ? 'current' : (status > 1 ? 'completed' : 'upcoming') 
            },
            { 
                label: 'Claim Pending (End of Lease)', 
                status: status === 2 ? 'current' : (status > 2 && status !== 3 ? 'completed' : 'upcoming') 
            },
            { 
                label: 'Resolved / Ended', 
                status: status === 4 ? 'completed' : 'upcoming' 
            }
        ];
        if (status === 3) {
            steps.push({ label: 'Disputed', status: 'error', description: 'Deposit claim dispute active.', date: defaultUpdate });
        }
    } else if (type === 'b2b-vendor') {
        const status = statusValue ?? 0;
        steps = [
            { label: 'Agreement Initialized', status: 'completed', date: defaultStart },
            { 
                label: 'Awaiting Funding', 
                status: status === 0 ? 'current' : (status > 0 ? 'completed' : 'upcoming'), 
                date: status > 0 ? defaultUpdate : undefined 
            },
            { 
                label: 'Invoice Submitted', 
                status: status === 1 || status === 2 ? 'current' : (status > 2 ? 'completed' : 'upcoming') 
            },
            { 
                label: 'Approved (Net Term Pending)', 
                status: status === 3 ? 'current' : (status > 3 && status !== 6 ? 'completed' : 'upcoming') 
            },
            { 
                label: 'Payment Released', 
                status: status === 4 ? 'completed' : 'upcoming' 
            }
        ];
        if (status === 6) {
            steps.push({ label: 'Disputed', status: 'error', date: defaultUpdate });
        }
    } else if (type === 'lease') {
        const status = statusValue ?? 0;
        steps = [
            { label: 'Lease Initialized', status: 'completed', date: defaultStart },
            { 
                label: 'Awaiting Full Deposit', 
                status: status === 0 ? 'current' : (status > 0 ? 'completed' : 'upcoming'), 
                date: status > 0 ? defaultUpdate : undefined 
            },
            { 
                label: 'Active Lease', 
                status: status === 1 ? 'current' : (status > 1 ? 'completed' : 'upcoming') 
            },
            { 
                label: 'Ended', 
                status: status === 3 ? 'completed' : 'upcoming' 
            }
        ];
        if (status === 2) {
            steps.push({ label: 'Disputed', status: 'error', date: defaultUpdate });
        }
    } else if (type === 'milestone') {
        // Dynamic based on milestones array
        steps.push({ label: 'Escrow Initialized', status: 'completed', date: defaultStart });
        if (milestones && milestones.length > 0) {
            milestones.forEach((m, idx) => {
                let stepStatus: TimelineStep['status'] = 'upcoming';
                const status = m.status;
                if (status === 3) stepStatus = 'completed'; // RELEASED
                else if (status === 0 || status === 1 || status === 2) stepStatus = 'current'; // PENDING/SUBMITTED/APPROVED
                else if (status === 4) stepStatus = 'error'; // REFUNDED (could be error or completed, we use error to highlight anomaly)
                else if (status === 5) stepStatus = 'error'; // DISPUTED
                
                steps.push({
                    label: `Milestone ${idx + 1}: ${m.description.substring(0, 30)}...`,
                    description: `Amount: ${m.amount.toString()}`,
                    status: stepStatus,
                    date: status === 3 ? defaultUpdate : undefined
                });
            });
            
            const allReleased = milestones.length > 0 && milestones.every(m => m.status === 3);
            steps.push({
                label: 'Fully Completed',
                status: allReleased ? 'completed' : 'upcoming',
            });
        } else {
            steps.push({
                label: 'Awaiting Milestone Setup',
                status: 'current'
            });
        }
    }

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-neutral-50 flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-neutral-400" /> Lifecycle Breakdown
            </h3>
            
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-4 top-2 bottom-6 w-px bg-neutral-800" />
                
                <div className="space-y-6">
                    {steps.map((step, idx) => {
                        const isCompleted = step.status === 'completed';
                        const isCurrent = step.status === 'current';
                        const isUpcoming = step.status === 'upcoming';
                        const isError = step.status === 'error';

                        return (
                            <div key={idx} className={cn("relative flex items-start gap-4", isUpcoming && "opacity-50")}>
                                <div className={cn(
                                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ring-4 ring-neutral-900",
                                    isCompleted ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" :
                                    isCurrent ? "bg-blue-500/10 border-blue-500 text-blue-500" :
                                    isError ? "bg-red-500/10 border-red-500 text-red-500" :
                                    "bg-neutral-800 border-neutral-700 text-neutral-500"
                                )}>
                                    {isCompleted && <Check className="h-4 w-4" />}
                                    {isCurrent && <Circle className="h-2 w-2 fill-current" />}
                                    {isError && <AlertTriangle className="h-4 w-4" />}
                                    {isUpcoming && <Lock className="h-3 w-3" />}
                                </div>
                                
                                <div className="flex-1 pb-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <h4 className={cn("font-medium", isCompleted || isCurrent ? "text-neutral-50" : isError ? "text-red-500" : "text-neutral-400")}>
                                            {step.label}
                                        </h4>
                                        {step.date && (
                                            <span className="text-xs text-neutral-500 font-mono mt-1 sm:mt-0">
                                                {step.date}
                                            </span>
                                        )}
                                    </div>
                                    {step.description && (
                                        <p className="text-sm text-neutral-500 mt-1">
                                            {step.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            <div className="mt-6 p-3 bg-neutral-950/50 rounded text-xs text-neutral-400 italic border border-neutral-800/50 flex gap-2 items-start">
               <AlertTriangle className="h-4 w-4 shrink-0 text-neutral-500" /> 
               <p>This timeline visually tracks the progress of the escrow contract according to block timestamps. In real-world scenarios, these timestamps ensure chronological verification of work and payments.</p>
            </div>
        </div>
    );
}
