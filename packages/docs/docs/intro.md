# Introduction to EscrowKit

EscrowKit is a comprehensive, open-source engine for building trustless escrow applications. It provides a complete stack—from smart contracts to a frontend dApp and TypeScript SDK—enabling developers to integrate secure milestone-based payments into their platforms.

## Core Features

- **Non-Custodial**: Funds are held in a smart contract, not by a middleman.
- **Milestone-Based**: Release funds incrementally as work is completed and approved.
- **Dispute Resolution**: built-in hooks for arbitration adapters (e.g., Kleros, specialized arbiters).
- **Full Stack**: Includes Solidity contracts, Indexer, API, dApp, and SDK.

## Architecture

EscrowKit is composed of several packages in a monorepo:

- \`packages/contracts\`: Foundry-based Solidity smart contracts.
- \`packages/indexer\`: Listens to chain events and indexes data to PostgreSQL.
- \`packages/api\`: NestJS API for querying escrow data.
- \`packages/dapp\`: Reference Next.js implementation.
- \`packages/sdk-ts\`: TypeScript SDK for easy integration.

## Getting Started

To run the full stack locally:

\`\`\`bash
# 1. Start local chain (Anvil)
anvil

# 2. Deploy contracts
cd packages/contracts && forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545

# 3. Start Database
docker compose up -d

# 4. Start Indexer & API & dApp
pnpm dev
\`\`\`
