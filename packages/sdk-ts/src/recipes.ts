import { EscrowKitClient } from './client.js';
import type { Address } from 'viem';

export class EscrowRecipes {
    constructor(private client: EscrowKitClient) { }

    async createFreelanceFixPrice(payee: Address, amountEth: string, description: string, daysToComplete: number) {
        // 1. Create Escrow
        const hash = await this.client.createEscrow(payee);
        // Wait for receipt would be needed here to get address, but simplfying for synchronous recipe pattern
        // In real SDK, we'd return a receipt or have better async handling
        return hash;
    }
}
