# EscrowKit

**EscrowKit** is an open-source, non-custodial Smart Escrow Engine built for seamless milestone-based payments. It provides a complete stack—from Solidity smart contracts to a Next.js dApp and TypeScript SDK—empowering developers to integrate trustless escrow functionality into any platform.

## 🚀 Features

- **Smart Contracts**: Secure, gas-optimized contracts using the Clone pattern (minimal proxies).
- **Milestone-Based**: Release funds incrementally as work is verified.
- **Arbitration Hook**: Plug-and-play adapter system for dispute resolution (e.g., Kleros).
- **Indexer**: Robust event listening and data persistence to PostgreSQL via Prisma.
- **SDK**: Developer-friendly TypeScript client (`@escrowkit/sdk-ts`).
- **Reference dApp**: Full UI for creating escrows, funding, and releasing payments.

## 📦 Monorepo Structure

This project is managed with [Turborepo](https://turbo.build/) and [pnpm](https://pnpm.io/).

| Package | Description | Path |
| :--- | :--- | :--- |
| **contracts** | Solidity Smart Contracts (Foundry) | `packages/contracts` |
| **indexer** | Event Indexer (Node.js/Viem/Prisma) | `packages/indexer` |
| **api** | REST API (NestJS) | `packages/api` |
| **dapp** | Frontend Interface (Next.js/Wagmi) | `packages/dapp` |
| **sdk-ts** | TypeScript SDK | `packages/sdk-ts` |
| **docs** | Documentation (Docusaurus) | `packages/docs` |

## 🛠️ Quick Start

### Prerequisites

- [Foundry](https://getfoundry.sh/) (for contracts)
- [Docker](https://www.docker.com/) (for Database)
- [Node.js](https://nodejs.org/) v20+ & [pnpm](https://pnpm.io/)

### 1. Start Local Blockchain

```bash
anvil
```

### 2. Deploy Contracts

```bash
cd packages/contracts
forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 3. Start Database

```bash
# In the root directory
docker compose up -d
```

### 4. Install & Run

```bash
# Install dependencies
pnpm install

# Generate Prisma Clients
pnpm turbo run generate

# Start all services (Indexer, API, dApp, Docs)
pnpm dev
```

- **dApp**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:3001](http://localhost:3001)
- **Docs**: [http://localhost:3002](http://localhost:3002)

## 📚 Documentation

Full documentation is available in the `packages/docs` folder or by running the docs site.

## 🤝 Contributing

Contributions are welcome! Please read `CONTRIBUTING.md` (coming soon) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

MIT