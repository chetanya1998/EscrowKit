import { PrismaClient } from '../src/generated/prisma';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const address = '0x1234567890123456789012345678901234567890';

    // Create an active escrow
    await prisma.escrow.upsert({
        where: { address: '0xActiveEscrow' },
        update: {},
        create: {
            address: '0xActiveEscrow',
            factoryAddress: '0xFactory',
            payer: address,
            payee: '0xPayee',
            arbiter: '0xArbiter',
            milestones: {
                create: [
                    {
                        index: 0,
                        amount: '1000000000000000000', // 1 ETH
                        description: 'Milestone 1',
                        status: 'PENDING'
                    }
                ]
            }
        }
    });

    // Create a completed escrow
    await prisma.escrow.upsert({
        where: { address: '0xCompletedEscrow' },
        update: {},
        create: {
            address: '0xCompletedEscrow',
            factoryAddress: '0xFactory',
            payer: address,
            payee: '0xPayee',
            arbiter: '0xArbiter',
            milestones: {
                create: [
                    {
                        index: 0,
                        amount: '2000000000000000000', // 2 ETH
                        description: 'Milestone 1',
                        status: 'RELEASED'
                    }
                ]
            }
        }
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
