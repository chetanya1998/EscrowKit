
import { createWalletClient, http, publicActions, parseEther, getContract } from 'viem';
import { foundry } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
// @ts-ignore
import EscrowFactoryArtifact from './packages/dapp/src/lib/EscrowFactory.json' with { type: "json" };
// import { VERIFICATION_ORACLE_ADDRESS } from './packages/dapp/src/lib/constants';

const FACTORY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // From constants.ts
const ACCOUNT_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Anvil Account #0

// Helper to manually read constants if imports fail (backup)
const MOCK_ORACLE = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

async function main() {
    const account = privateKeyToAccount(ACCOUNT_PK);
    const client = createWalletClient({
        account,
        chain: foundry,
        transport: http()
    }).extend(publicActions);

    console.log(`Using account: ${account.address}`);

    const factory = getContract({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: EscrowFactoryArtifact.abi,
        client
    });

    console.log(`Creating Escrow via Factory at ${FACTORY_ADDRESS}...`);

    // createEscrow(address payee, address arbiter, address arbitrationAdapter, bytes32 metaEvidence, address verificationOracle, (uint256,uint256,uint256) config)
    const payee = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Anvil Account #1
    const arbiter = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Anvil Account #2
    const arbitrationAdapter = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const verificationOracle = MOCK_ORACLE;

    // Config: arbitrationFee (0.01 ETH), disputeWindow (3 days), automaticReleaseTime (30 days)
    const config = {
        arbitrationFee: parseEther("0.01"),
        disputeWindow: BigInt(3 * 24 * 60 * 60), // 3 days
        automaticReleaseTime: BigInt(30 * 24 * 60 * 60) // 30 days
    };

    // bytes32 metaEvidence (placeholder)
    const metaEvidence = "0x0000000000000000000000000000000000000000000000000000000000000000";

    const hash = await factory.write.createEscrow([
        payee,
        arbiter,
        arbitrationAdapter,
        metaEvidence,
        verificationOracle,
        config
    ]);

    console.log(`Transaction submitted: ${hash}`);

    const receipt = await client.waitForTransactionReceipt({ hash });

    // Find EscrowCreated event
    const events = await client.getContractEvents({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: EscrowFactoryArtifact.abi,
        eventName: 'EscrowCreated',
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber
    });

    if (events.length > 0) {
        const escrowAddress = (events[0] as any).args.escrowAddress;
        console.log(`SUCCESS: Created Escrow at: ${escrowAddress}`);
        console.log(`URL: http://localhost:3000/escrow/${escrowAddress}`);
    } else {
        console.error("Could not find EscrowCreated event in logs.");
        console.log(JSON.stringify(receipt.logs, null, 2));
    }
}

main().catch(console.error);
