import { EscrowKitClient } from './client.js';
import { parseEther, type Address } from 'viem';

export class EscrowRecipes {
    constructor(private client: EscrowKitClient) { }

    async createFreelanceFixPrice(payee: Address, amountEth: string, description: string, daysToComplete: number) {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const deadline = BigInt(nowInSeconds + daysToComplete * 24 * 60 * 60);
        const hash = await this.client.createEscrow({
            payee,
            config: {
                arbitrationFeeBps: 0n,
                payerPenaltyBps: 0n,
                payeePenaltyBps: 0n,
                disputeWindow: 7n * 24n * 60n * 60n,
                reviewPeriod: 7n * 24n * 60n * 60n,
            },
            amounts: [parseEther(amountEth)],
            descriptions: [description],
            deadlines: [deadline],
            conditionHashes: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
        });
        // Wait for receipt would be needed here to get address, but simplfying for synchronous recipe pattern
        // In real SDK, we'd return a receipt or have better async handling
        return hash;
    }
}
