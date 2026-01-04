import { createPublicClient, http, parseAbiItem } from 'viem';
import { foundry } from 'viem/chains';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { 
  EscrowFactoryABI, 
  MilestoneEscrowABI 
} from './abis';

dotenv.config();

const prisma = new PrismaClient();

// Use Anvil chain
const client = createPublicClient({
  chain: foundry,
  transport: http(process.env.RPC_URL || 'http://127.0.0.1:8545'),
});

const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS as `0x${string}`;

async function main() {
  console.log('Indexer starting...');
  console.log('Connecting to RPC:', client.chain.name);
  
  // Watch for EscrowCreated events
  console.log(`Watching Factory at ${FACTORY_ADDRESS}`);
  
  client.watchContractEvent({
    address: FACTORY_ADDRESS,
    abi: EscrowFactoryABI,
    eventName: 'EscrowCreated',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { escrowAddress, payer, payee, arbiter } = log.args;
        console.log(`New Escrow: ${escrowAddress}`);
        
        try {
          // Create Escrow in DB
          await prisma.escrow.create({
            data: {
              address: escrowAddress!,
              payer: payer!,
              payee: payee!,
              arbiter: arbiter,
              factoryAddress: FACTORY_ADDRESS,
              // Initial milestones would need to be fetched, but for now we just create the record
            }
          });
          
          // Start watching this new escrow instance
          watchEscrow(escrowAddress!);
        } catch (e) {
          console.error('Error indexing escrow:', e);
        }
      }
    }
  });
}

function watchEscrow(address: `0x${string}`) {
  console.log(`Watching Escrow instance: ${address}`);
  
  // Watch all relevant events
  
  // MilestoneAdded
  client.watchContractEvent({
    address,
    abi: MilestoneEscrowABI,
    eventName: 'MilestoneAdded',
    onLogs: async (logs) => {
        for (const log of logs) {
            const { milestoneId, amount } = log.args;
            console.log(`Milestone Added: ${milestoneId} on ${address}`);
            // In a real indexer we would fetch the full struct to get description/deadline
            // For MVP, simplistic insert or update
        }
    }
  });

  // MilestoneFunded
  client.watchContractEvent({
    address,
    abi: MilestoneEscrowABI,
    eventName: 'MilestoneFunded',
    onLogs: async (logs) => {
        // Log event
    }
  });
  
  // ... Implement other events similarly (Submitted, Approved, Released)
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
