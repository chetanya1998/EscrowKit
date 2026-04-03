import { createPublicClient, type PublicClient, type WalletClient, type Address, type Chain } from 'viem';
import { foundry } from 'viem/chains';
import { FactoryV2ABI, MilestoneEscrowV1ABI, MilestoneEscrowV2ABI } from '@escrowkit/protocol';

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

    async createEscrow(args: {
        payee: Address;
        arbiter?: Address;
        arbitrationAdapter?: Address;
        detailsHash?: `0x${string}`;
        verificationOracle?: Address;
        token?: Address;
        config: {
            arbitrationFeeBps: bigint;
            payerPenaltyBps: bigint;
            payeePenaltyBps: bigint;
            disputeWindow: bigint;
            reviewPeriod: bigint;
        };
        amounts: bigint[];
        descriptions: string[];
        deadlines: bigint[];
        conditionHashes: `0x${string}`[];
    }) {
        if (!this.walletClient || !this.walletClient.account) throw new Error("Wallet not connected");

        return this.walletClient.writeContract({
            address: this.factoryAddress,
            abi: FactoryV2ABI,
            functionName: 'createEscrow',
            args: [
                args.payee,
                args.arbiter ?? '0x0000000000000000000000000000000000000000',
                args.arbitrationAdapter ?? '0x0000000000000000000000000000000000000000',
                args.detailsHash ?? '0x0000000000000000000000000000000000000000000000000000000000000000',
                args.verificationOracle ?? '0x0000000000000000000000000000000000000000',
                args.token ?? '0x0000000000000000000000000000000000000000',
                args.config,
                args.amounts,
                args.descriptions,
                args.deadlines,
                args.conditionHashes,
            ],
            account: this.walletClient.account!,
            chain: foundry
        });
    }

    async addMilestones(escrowAddress: Address, args: { amounts: bigint[]; descriptions: string[]; deadlines: bigint[] }) {
        if (!this.walletClient || !this.walletClient.account) throw new Error("Wallet not connected");

        return this.walletClient.writeContract({
            address: escrowAddress,
            abi: MilestoneEscrowV1ABI,
            functionName: 'addMilestones',
            args: [
                args.amounts,
                args.descriptions,
                args.deadlines,
                args.amounts.map(() => '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`),
            ],
            account: this.walletClient.account!,
            chain: foundry
        });
    }

    async fund(escrowAddress: Address, amount: bigint) {
        if (!this.walletClient || !this.walletClient.account) throw new Error("Wallet not connected");

        return this.walletClient.writeContract({
            address: escrowAddress,
            abi: MilestoneEscrowV2ABI,
            functionName: 'fund',
            value: amount,
            account: this.walletClient.account!,
            chain: foundry
        });
    }

    async submitDeliverable(escrowAddress: Address, milestoneId: number, deliverableHash: `0x${string}`) {
        if (!this.walletClient || !this.walletClient.account) throw new Error("Wallet not connected");

        return this.walletClient.writeContract({
            address: escrowAddress,
            abi: MilestoneEscrowV2ABI,
            functionName: 'submitDeliverable',
            args: [BigInt(milestoneId), deliverableHash],
            account: this.walletClient.account!,
            chain: foundry
        });
    }

    async approveMilestone(escrowAddress: Address, milestoneId: number) {
        if (!this.walletClient || !this.walletClient.account) throw new Error("Wallet not connected");

        return this.walletClient.writeContract({
            address: escrowAddress,
            abi: MilestoneEscrowV2ABI,
            functionName: 'approveMilestone',
            args: [BigInt(milestoneId)],
            account: this.walletClient.account!,
            chain: foundry
        });
    }
}
