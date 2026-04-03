# EscrowKit

> Last updated: April 3, 2026  
> Status: active development

EscrowKit is a pnpm + Turborepo monorepo for non-custodial escrow flows on Ethereum-compatible networks. The current product focus is milestone escrows, with smart contracts as the source of truth, an indexer that syncs chain state into Postgres, a NestJS API for read models and auth, and a Next.js dapp for wallet-based interaction.

## Latest updates

### April 2026

- Added `packages/protocol` as the generated ABI and deployment source of truth for the dapp, API, indexer, and SDK.
- Standardized milestone escrow creation on the v2 flow, where milestones are passed at factory creation time.
- Added `EscrowCreatedV2(...)` so the indexer can classify escrows by kind and protocol version without ABI guesswork.
- Made the dapp milestone flow version-aware so new escrows use v2 while legacy milestone escrows still support legacy setup where needed.
- Added ERC-20 approval-aware funding UX so token escrows now guide users through approve then fund.
- Removed authenticated dashboard fallback-to-mock behavior and switched dashboard/history views to API/indexer-backed states.
- Extended the read model with `chainId`, `escrowType`, `protocolVersion`, `tokenAddress`, `detailsHash`, `createdTxHash`, and deterministic event ordering with `blockNumber + logIndex`.
- Updated the indexer to seed v2 milestones immediately on escrow creation instead of relying on creation-time milestone events that can be missed.
- Hardened auth with `GET /api/v1/auth/session`, wallet-owner guards on `/users/:address/*`, and hashed API key storage with one-time secret return.
- Added CI protection for generated protocol artifacts, API tests, dapp typecheck/tests, and repo-wide build validation.

## Architecture

```mermaid
graph TD
    U["User / Marketplace"] --> D["dApp (Next.js + wagmi)"]
    D --> C["Escrow Contracts"]
    C --> I["Indexer (viem + Prisma)"]
    I --> P[("Postgres")]
    A["API (NestJS)"] --> P
    D --> A
    V["Verification Oracle / Pulsar"] --> C
```

Runtime flow:

1. The dapp writes directly to smart contracts.
2. Contracts emit events.
3. The indexer consumes those events and writes a queryable read model into Postgres.
4. The API serves dashboards, user profiles, API keys, evidence, public reads, and auth/session checks.
5. The dapp mixes direct on-chain interaction with API-backed views.

## Monorepo layout

```text
packages/
  api/         NestJS API
  contracts/   Solidity contracts and Foundry tests
  dapp/        Next.js App Router frontend
  docs/        Docusaurus docs site
  indexer/     Chain event indexer
  protocol/    Generated ABIs, runtime hashes, and deployment helpers
  sdk-ts/      TypeScript SDK
```

## Package responsibilities

| Package | Purpose |
| --- | --- |
| `packages/contracts` | EscrowFactory, milestone escrow logic, specialized escrow types, arbitration adapters, verification oracle |
| `packages/protocol` | Generated ABI source of truth consumed by dapp, API, indexer, and SDK |
| `packages/indexer` | Watches factory and escrow events, seeds v2 milestones on create, persists deterministic history using `blockNumber + logIndex` |
| `packages/api` | SIWE auth, wallet-owner protected user endpoints, public read endpoints, API key management, evidence/webhook/pulsar modules |
| `packages/dapp` | Wallet UX, create flows, dashboard, escrow lifecycle actions, ERC-20 approval + fund state machine |
| `packages/sdk-ts` | Thin viem-based SDK that now targets the v2 milestone factory shape |
| `packages/docs` | Documentation site |

## Protocol model

### Shared source of truth

Contract interfaces should not be copied by hand. The generated protocol package exports:

- `FactoryV1ABI`
- `FactoryV2ABI`
- `MilestoneEscrowV1ABI`
- `MilestoneEscrowV2ABI`
- `EscrowKind`
- `ProtocolVersion`
- `resolveDeployments(...)`

The generator lives in [packages/protocol/scripts/generate.mjs](/Users/chetanya/Escrowkit/packages/protocol/scripts/generate.mjs).

### Milestone versions

- `v2` is the canonical write path. New milestone escrows are created with milestones included in the factory call.
- `v1` is maintained for legacy reads and legacy milestone setup where `addMilestones` still exists and the escrow has no milestones yet.

### Factory events

The factory now emits both:

- `EscrowCreated(...)` for legacy compatibility
- `EscrowCreatedV2(...)` for version-aware indexing and richer metadata

## Local development

### Prerequisites

- Node.js 20+
- pnpm 10+
- Foundry
- Docker

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start local infrastructure

```bash
docker compose up -d postgres redis
```

This starts:

- Postgres on `localhost:5432`
- Redis on `localhost:6379`

### 3. Generate Prisma clients

```bash
pnpm --filter api generate
pnpm --filter indexer generate
```

### 4. Start Anvil and deploy contracts

In one terminal:

```bash
anvil
```

In another terminal:

```bash
pnpm --filter contracts deploy
```

After deployment, copy the deployed addresses into your local env files. Local Anvil does not have baked-in deployment defaults, so the dapp, API, and indexer should all point to your local factory/oracle/adapter addresses.

### 5. Configure environment variables

#### `packages/api/.env`

```bash
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/escrowkit?schema=public
JWT_SECRET=replace-me
CHAIN_ID=31337
RPC_URL=http://127.0.0.1:8545
FACTORY_ADDRESS=0x...
VERIFICATION_ORACLE_ADDRESS=0x...
ARBITER_ADAPTER_ADDRESS=0x...
```

#### `packages/indexer/.env`

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/escrowkit?schema=public
CHAIN_ID=31337
RPC_URL=http://127.0.0.1:8545
FACTORY_ADDRESS=0x...
LEGACY_FACTORY_ADDRESSES=
VERIFICATION_ORACLE_ADDRESS=0x...
```

#### `packages/dapp/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_LEGACY_FACTORY_ADDRESSES=
NEXT_PUBLIC_ARBITER_ADAPTER_ADDRESS=0x...
NEXT_PUBLIC_VERIFICATION_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_EXPLORER_URL=http://localhost:8545
```

Optional frontend vars:

- `NEXT_PUBLIC_DEPLOY_TARGET=gh-pages`
- Firebase `NEXT_PUBLIC_FIREBASE_*` values

### 6. Start services

Run each service in its own terminal:

```bash
pnpm --filter api start:dev
pnpm --filter indexer dev
pnpm --filter dapp dev
```

Typical local URLs:

- dapp: `http://localhost:3000`
- API: `http://localhost:3001`

## Build and test

### Repository-wide

```bash
pnpm build
```

### Contracts

```bash
pnpm --filter contracts build
pnpm --filter contracts test
```

If Foundry crashes while probing system proxy configuration in a restricted environment, use:

```bash
cd packages/contracts
forge test --offline
```

### Protocol package

```bash
pnpm --filter @escrowkit/protocol build
```

### API

```bash
pnpm --filter api test
pnpm --filter api build
```

### dapp

```bash
pnpm --filter dapp typecheck
pnpm --filter dapp test
pnpm --filter dapp build
```

### Indexer

```bash
pnpm --filter indexer build
```

## Auth and API model

### Auth flow

- `GET /api/v1/auth/nonce`
- `POST /api/v1/auth/verify`
- `GET /api/v1/auth/session`

The dapp uses SIWE to obtain a session token, stores it client-side, and validates it on boot. User-scoped endpoints under `/users/:address/*` require both:

- a valid bearer token
- the authenticated wallet address to match the `:address` route param

### API keys

API keys are:

- generated once
- returned in raw form only once
- stored as `sha256` hashes
- listed later only as masked metadata

## Current milestone flow

The milestone happy path this repo currently optimizes for is:

1. Create milestone escrow from the dapp using the v2 factory interface
2. Redirect directly to the escrow detail page
3. Approve ERC-20 token allowance if needed
4. Fund the escrow
5. Submit deliverables
6. Approve release or refund / open dispute
7. View history through the indexed dashboard/API read model

The dapp detects legacy milestone escrows and falls back to the legacy milestone setup flow only when needed.

## CI expectations

GitHub Actions currently verifies:

- protocol generation consistency
- full monorepo build
- Foundry contract tests
- API tests
- dapp typecheck
- dapp tests

## Notes

- The dapp build uses webpack for production builds because it is more stable than Turbopack in restricted environments.
- The dapp build may show warnings from optional `wagmi` connector peer dependencies. Those warnings do not currently block a successful build.
- Base Sepolia defaults live in [packages/protocol/src/deployments.ts](/Users/chetanya/Escrowkit/packages/protocol/src/deployments.ts).

## Useful commands

```bash
pnpm install
docker compose up -d
pnpm --filter api generate
pnpm --filter indexer generate
pnpm --filter contracts deploy
pnpm --filter api start:dev
pnpm --filter indexer dev
pnpm --filter dapp dev
pnpm build
```
