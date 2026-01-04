import { createPublicClient, http, type PublicClient, type WalletClient, type Address, type Chain } from 'viem';
import { foundry } from 'viem/chains';
import { MilestoneStatus } from './types.js';

// Constants (Should be exported from a shared package or similar)
export const FACTORY_ABI = [
    {
        "type": "function",
        "name": "createEscrow",
        "inputs": [
            { "name": "payee", "type": "address", "internalType": "address" },
            { "name": "arbiter", "type": "address", "internalType": "address" },
            { "name": "arbitrationAdapter", "type": "address", "internalType": "address" },
            { "name": "detailsHash", "type": "bytes32", "internalType": "bytes32" }
        ],
        "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
        "stateMutability": "payable"
    }
] as const;

export const ESCROW_ABI = [
    {
        "type": "function",
        "name": "addMilestones",
        "inputs": [
            { "name": "amounts", "type": "uint256[]" },
            { "name": "descriptions", "type": "string[]" },
            { "name": "deadlines", "type": "uint256[]" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "fund",
        "inputs": [],
        "outputs": [],
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "submitDeliverable",
        "inputs": [
            { "name": "milestoneId", "type": "uint256" },
            { "name": "deliverableHash", "type": "bytes32" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "approveMilestone",
        "inputs": [
            { "name": "milestoneId", "type": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
] as const;

export class EscrowKitClient {
    publicClient: PublicClient;
    walletClient?: WalletClient;
    factoryAddress: Address;

    constructor(config: {
        chain: Chain,
        transport: any,
        factoryAddress: Address,
        walletClient?: WalletClient
    }) {
        this.publicClient = createPublicClient({
            chain: config.chain,
            transport: config.transport,
        });
        this.walletClient = config.walletClient;
        this.factoryAddress = config.factoryAddress;
    }

    async createEscrow(payee: Address, arbiter: Address = '0x0000000000000000000000000000000000000000') {
        if (!this.walletClient || !this.walletClient.account) throw new Error("Wallet not connected");

        return this.walletClient.writeContract({
            address: this.factoryAddress,
            abi: FACTORY_ABI,
            functionName: 'createEscrow',
            args: [payee, arbiter, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000000000000000000000000000'],
            account: this.walletClient.account!,
            chain: foundry
        });
    }

    async addMilestones(escrowAddress: Address, args: { amounts: bigint[], descriptions: string[], deadlines: bigint[] }) {
        if (!this.walletClient || !this.walletClient.account) throw new Error("Wallet not connected");

        return this.walletClient.writeContract({
            address: escrowAddress,
            abi: ESCROW_ABI,
            functionName: 'addMilestones',
            args: [args.amounts, args.descriptions, args.deadlines],
            account: this.walletClient.account!,
            chain: foundry
        });
    }

    async fund(escrowAddress: Address, amount: bigint) {
        if (!this.walletClient || !this.walletClient.account) throw new Error("Wallet not connected");

        return this.walletClient.writeContract({
            address: escrowAddress,
            abi: ESCROW_ABI,
            functionName: 'fund',
            value: amount,
            account: this.walletClient.account!,
            chain: foundry
        });
    }

    // Add submit, approve, etc.
}
