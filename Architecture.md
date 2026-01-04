# EscrowKit Architecture

## System Overview
EscrowKit is a non-custodial smart escrow engine. It uses smart contracts to hold funds and an indexer/API layer to provide a rich user experience.

## Modules & Boundaries

### 1. Smart Contracts (`packages/contracts`)
- **Responsibility**: Hold funds, manage milestones, execute payouts/refunds, handle dispute initiation.
- **Boundaries**: 
  - Input: Transactions from Users/SDK.
  - Output: On-chain events (EscrowCreated, Funded, Released, etc.).
  - Dependencies: None (pure on-chain).

### 2. Indexer (`packages/indexer`)
- **Responsibility**: Listen to blockchain events and project them into a relational database.
- **Boundaries**:
  - Input: RPC Provider (Anvil/Ethereum).
  - Output: Postgres Database writes (Escrows, Milestones, Events).
  - Reorg handling: Must handle chain reorgs (basic implementation).

### 3. Read API (`packages/api`)
- **Responsibility**: Serve escrow data to the frontend, handle evidence metadata uploads.
- **Boundaries**:
  - Input: HTTP requests from Dapp/SDK.
  - Output: JSON responses.
  - State: Read-only from Postgres (written by indexer), Write evidence metadata (to local disk/S3).

### 4. dApp (`packages/dapp`)
- **Responsibility**: UI for creating and managing escrows.
- **Boundaries**:
  - Interact with Contracts (Write) via Wallet (wagmi/viem).
  - Interact with API (Read) via HTTP (TanStack Query).

### 5. SDK (`packages/sdk-ts`)
- **Responsibility**: Typed wrapper around contracts for developers.
- **Boundaries**:
  - Used by Dapp and 3rd party integrators.

## Data Flow

1. **User Action**: User connects wallet on dApp and calls `createEscrow()`.
2. **On-Chain**: Contract emits `EscrowCreated(address, ...)`.
3. **Indexing**: Indexer detects event, creates `Escrow` record in DB with status `INITIALIZED`.
4. **UI Update**: dApp polls API/Indexer or refetches to show new escrow.
5. **Interaction**: Payer calls `fund()` -> Event `EscrowFunded` -> Indexer updates status -> dApp shows "Funded".
6. **Dispute**: User calls `openDispute()` -> Event -> Indexer updates status -> dApp shows Dispute UI.

## Invariants
- **Non-Custodial**: Backend API never holds private keys or control over funds.
- **Solvency**: `Balance = Released + Refunded + Remaining`.
- **Immutability**: Milestones cannot be changed after funding (MVP).
