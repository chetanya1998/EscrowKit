# EscrowKit: The Trustless Marketplace Engine 🛡️

**Secure, Milestone-Based Payments for Any Platform.**

EscrowKit is a complete "Boxed Solution" for adding secure escrow transactions to your marketplace, freelance platform, or gig economy app. It handles the complexity of smart contracts, disputes, and payment releases so you don't have to.

---

## 🌟 Key Features

*   **⚡ Smart Escrow Contracts**: Audited, gas-optimized contracts for milestone payments.
*   **⚖️ Built-in Arbitration**: Integrated dispute resolution (Kleros, Reality.eth, or custom).
*   **🖥️ Admin Dashboard**: Manage transactions, disputes, and API keys in one place.
*   **🔌 Easy Integration**: REST API and SDK for deep integration into your existing platform.
*   **🔍 Indexer Service**: Real-time data syncing from blockchain to a queryable database.

---

## 📡 API Reference

EscrowKit exposes a REST API for platforms to query data programmatically.

For detailed documentation on all endpoints, requests, and responses, please see [API.md](./API.md).

**Base URL**: `http://localhost:3001` (Local Development)

---

## 🏗️ Architecture

EscrowKit allows you to remain **Non-Custodial**. You never touch the user's funds.

For a deep dive into the system design, see [Architecture.md](./Architecture.md).

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js v18+
*   pnpm
*   Foundry (for local blockchain)
*   Docker (for Database)

### 1. Start Local Blockchain
```bash
anvil
```

### 2. Deploy Contracts
```bash
cd packages/contracts
forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545
```

### 3. Run Backend (API & Indexer)
```bash
cd packages/api
pnpm dev
# In another terminal
cd packages/indexer
pnpm dev
```

### 4. Run Dashboard (dApp)
```bash
cd packages/dapp
pnpm dev
```
Visit `http://localhost:3000` to see your running instance!

---

## 🧪 Testing

**Unit Tests**:
```bash
cd packages/dapp
npx jest
```

**E2E / Script Verification**:
```bash
npx ts-node --compiler-options '{"resolveJsonModule":true}' create-escrow.ts
```

---

## 🤝 Contributing
1.  Fork the repo
2.  Create a feature branch
3.  Submit a Pull Request

---

**Built with ❤️ for a Trustless Future.**