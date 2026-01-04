import type { Address } from 'viem';

export enum MilestoneStatus {
    PENDING = 0,
    SUBMITTED = 1,
    APPROVED = 2,
    RELEASED = 3,
    REFUNDED = 4,
    DISPUTED = 5
}

export interface Milestone {
    amount: bigint;
    description: string;
    deadline: bigint;
    status: MilestoneStatus;
    deliverableHash: string; // bytes32
    disputeId: bigint;
}

export interface EscrowDetails {
    payer: Address;
    payee: Address;
    arbiter: Address;
    milestones: Milestone[];
}
