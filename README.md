# EscrowKit

Non-custodial escrow infrastructure for marketplaces, freelancers, rentals, and B2B workflows.

> Last updated: April 5, 2026  
> License: MIT (see `LICENSE`)

## Start here (pick your path)

- PMs: start at **What It Does** and **Roadmap**.
- Founders: start at **How You Can Use It** and **Developer Quickstart**.
- Developers: jump to **Developer Quickstart**.
- Open source contributors: start at **Contributing** and **Repo Map**.
- India expansion: jump to **India Readiness Plan**.

## What it does

EscrowKit helps two parties transact with less trust:

- A payer locks funds into a smart contract.
- A payee delivers work or a service.
- Funds are released per milestone when approved.
- If things go wrong, disputes can be opened and resolved via an arbiter or adapter.

EscrowKit is designed to be **non-custodial**: the platform never holds user funds in a database or operator wallet.

## Who it's for

### PMs (product and ops)

- Understand the end-to-end flow, current capabilities, and what to build next.
- Plan localization and compliance work for new markets (see **India Readiness Plan**).
- Use the **Release notes** section to track shipped platform changes.

### Founders (platform builders)

You can use EscrowKit in three ways:

1. Ship the dapp UI as your first "escrow checkout".
2. Embed escrow into your own UI via the SDK and contracts.
3. Use the API + indexer as your system-of-record for dashboards, webhooks, reconciliation, and reporting.

### Developers (integrators)

- Smart contracts are the source of truth.
- The indexer builds a Postgres read model from chain events.
- The API exposes that read model and handles auth, keys, and integrations.
- The dapp uses a wallet to execute on-chain writes and uses the API for dashboards/history.

### Open source developers

- The repo is MIT licensed.
- Contributions are welcome: bug fixes, tests, docs, new escrow types, indexer improvements, and UI/UX work.

## How EscrowKit works (high level)

```mermaid
graph TD
    U["User / Platform"] --> D["dapp (Next.js)"]
    D -->|Writes| C["Smart contracts"]
    C -->|Events| I["Indexer (viem)"]
    I --> P[("Postgres")]
    D -->|Reads| A["API (NestJS)"]
    A --> P
```

End-to-end flow:

1. Create escrow (payer chooses payee, token, milestones, dispute settings).
2. Fund escrow (ETH or ERC-20).
3. Payee submits deliverables per milestone.
4. Payer approves, releasing funds milestone-by-milestone.
5. Refund or dispute if requirements are not met.
6. Dashboard/history comes from the indexed Postgres read model.

## What's implemented today

Core:

- Milestone escrow create/fund/submit/approve/refund/dispute flows.
- ERC-20 approval-aware funding UX (approve then fund).
- Version-aware milestone support:
  - v2: milestones are passed at escrow creation time.
  - v1 (legacy): read + legacy milestone setup where applicable.

Platform:

- Shared protocol package (`packages/protocol`) is the ABI + deployment source of truth for dapp/API/indexer/SDK.
- Indexer persists deterministic event ordering (`blockNumber + logIndex`) and seeds v2 milestones on create.
- API auth via SIWE session tokens and strict wallet ownership checks for user-scoped endpoints.
- API keys stored hashed (one-time reveal), used for public API endpoints and webhooks.

## Repo map

```text
packages/
  contracts/   Solidity contracts and Foundry tests
  protocol/    Generated ABIs + deployments helpers (source of truth)
  indexer/     Watches chain events -> Postgres read model
  api/         NestJS API for reads/auth/keys/webhooks
  dapp/        Next.js UI for users and admins
  sdk-ts/      TypeScript SDK (viem client, recipes, and bundled types)
  docs/        Docusaurus documentation site
```

## TypeScript SDK

The SDK lives in `packages/sdk-ts` and builds on top of `@escrowkit/protocol`, which remains the source of truth for generated ABIs and deployment helpers.

Current SDK surface:

- `EscrowKitClient` for wallet-driven contract writes.
- `EscrowRecipes` for higher-level helper flows.
- `MilestoneStatus`, `Milestone`, and `EscrowDetails` for shared types.

Current client methods:

- `createEscrow(...)` for v2 milestone escrow creation.
- `addMilestones(...)` for legacy v1 escrows.
- `fund(...)` for native-token funding.
- `submitDeliverable(...)` and `approveMilestone(...)` for milestone execution.

Rebuild order after ABI or SDK source changes:

```bash
pnpm --filter @escrowkit/protocol build
pnpm --filter sdk-ts build
```

The SDK build currently emits ESM, CJS, and declaration files under `packages/sdk-ts/dist`.

## Developer quickstart (local)

### Prerequisites

- Node.js 20+
- pnpm 10+
- Foundry
- Docker

### Install

```bash
pnpm install
```

### Start Postgres + Redis

```bash
docker compose up -d postgres redis
```

### Generate Prisma clients

```bash
pnpm --filter api generate
pnpm --filter indexer generate
```

### Run a local chain and deploy contracts

Terminal 1:

```bash
anvil
```

Terminal 2:

```bash
pnpm --filter contracts deploy
```

### Configure env vars

Local Anvil has no baked-in deployment defaults, so point the dapp/API/indexer at your local deployment addresses.

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

### Start services

Run each service in its own terminal:

```bash
pnpm --filter api start:dev
pnpm --filter indexer dev
pnpm --filter dapp dev
```

Local URLs:

- dapp: `http://localhost:3000`
- API: `http://localhost:3001`

## Contributing (open source)

### Where to start

- Read the repo map above.
- Start with unit tests and small scoped improvements:
  - Contracts: Foundry tests in `packages/contracts/test`.
  - API: Jest tests under `packages/api/src/**/*.spec.ts`.
  - dapp: Jest tests under `packages/dapp/src/**/*.test.tsx`.

### PR checklist (practical)

- If you changed any contract ABI/events: run `pnpm --filter contracts build`, then `pnpm --filter @escrowkit/protocol build`, then `pnpm --filter sdk-ts build`.
- Keep changes additive for API response shapes when possible.
- Run: `pnpm build` and the relevant package tests before opening a PR.

### Good contribution areas

- Wallet-driven e2e tests (Playwright/Synpress) for the milestone happy path.
- Indexing other escrow types (rental/service/lease/B2B) end-to-end.
- Better dispute/evidence UX and dispute center.
- Docs updates and onboarding improvements.

## Roadmap (features)

### Core platform roadmap

Now (stability and completeness):

- Wallet-driven browser e2e for `create -> approve -> fund -> submit -> approve -> dashboard history`.
- First-class indexing and dashboard support for all escrow types (rental/service/lease/B2B).
- "Dispute center" UI: evidence timeline, comments, arbiter actions, resolution summary.
- Better metadata: store human-readable terms off-chain via `detailsHash`.

Next (product expansion):

- Saved templates and reusable agreements.
- Notifications (email + SMS/WhatsApp-style) and webhook delivery status with retries.
- Verification automations (GitHub, invoice approval, delivery proofs) via VerificationOracle + services.
- Role-based delegation (accountant/ops mode) with audit logs.

Later (scale and ecosystem):

- Advanced arbitration adapters and multi-chain deployments.
- Analytics and reporting exports for operations/accounting.
- Hardened on-chain upgrade strategy (if introduced) and formal audits.

## India readiness plan (product Indianisation)

This is product guidance, not legal advice. Any custody, INR rails, on-ramp flows, or identity requirements should be validated with Indian counsel before production rollout.

### Must-haves (India V1)

1. India mode onboarding (trust + disclosures)
   - UI journey:
     - Landing: choose `India` (or auto-detect, confirm)
     - Explain: "Funds are locked in smart contracts (non-custodial). This is not UPI/bank custody."
     - Consent: privacy + data processing + key risk disclosures
     - Continue to wallet connect

2. INR-first pricing (reduce token anxiety)
   - UI journey:
     - Create escrow: enter amounts in `INR` first
     - Show token equivalent, estimated gas, total payer outflow
     - Funding screen: clear "Acquire token then fund" guidance (no hidden assumptions)

3. Evidence-first dispute experience
   - UI journey:
     - Each milestone: `Add proof` (invoice, screenshots, delivery note, WhatsApp export, PDF)
     - Dispute page: chronological timeline in IST, per-evidence comments, shareable case link
     - Arbiter page: agreement summary + evidence bundle + ruling actions

4. KYC/KYB and signed terms (for India-facing B2B/rental/freelance)
   - UI journey:
     - Before deploy: collect KYB (GSTIN/company) or individual verification (provider-dependent)
     - Generate an agreement summary and store hash in `detailsHash`
     - Optional eSign integration for legally recognized signatures

5. Mobile-first + bilingual (English/Hindi) core flows
   - UI journey:
     - Language choice at first run
     - All critical screens bilingual, minimal dense text, clear CTA states

6. Notifications beyond email
   - UI journey:
     - Opt-in: SMS/WhatsApp/email
     - Milestone state changes trigger notifications with deep links

### Should-haves (India V2)

1. Regional language expansion
   - Suggested first set: Marathi, Tamil, Telugu, Bengali, Kannada, Malayalam.

2. Voice-guided help (reduce onboarding friction)
   - Voice explanations and step-by-step guided creation, with typed confirmation for sensitive steps.

3. Delegate approvals ("accountant/ops mode")
   - Invite delegates to prepare actions; final releases require governed approvals.

4. Tax/report exports for CA/accountant workflows
   - Export CSV/PDF of escrow events, token amounts, timestamps, and counterparties.

## Release notes

### April 2026 engineering update

- Introduced `packages/protocol` as the ABI and deployment source of truth (no more hand-copied ABIs).
- Standardized milestone creation on v2 (milestones passed at creation time) while maintaining legacy v1 reads/setup.
- Added `EscrowCreatedV2(...)` and made the indexer version-aware with milestone seeding on create.
- Added strict server-side wallet-owner authorization for `/users/:address/*` and `GET /api/v1/auth/session`.
- Hardened API key management (hash at rest, one-time reveal, masked list views).
- Improved ERC-20 funding UX (approval required, approval pending, ready-to-fund, funding pending, confirmed).
- CI now checks protocol generation consistency + runs API/dapp tests and repo build.

## Security layers (what's implemented)

EscrowKit's security posture is layered. This section documents what exists today and what is explicitly not covered.

### Layer 1: Smart contracts (fund safety)

Implemented:

- Non-custodial design: funds remain in escrow contracts until release/refund/dispute resolution.
- `ReentrancyGuard` on release paths in milestone escrows.
- `SafeERC20` for token transfers and `address(0)` handling for native ETH.
- Factory-wide pause via `AccessControl` + `Pausable` (global stop-the-world lever).
- Role/party checks (`onlyPayer`, `onlyPayee`, arbiter/adapter authorization).
- Config bounds checking (fee/penalty bps caps) and array length checks at initialization.

Not yet covered (needs explicit work/audit):

- Formal third-party audit and published threat model.
- Formal verification or fuzz/property tests for critical invariants across all escrow types.

### Layer 2: Indexer and data integrity (history correctness)

Implemented:

- Deterministic event ordering persisted via `blockNumber + logIndex`.
- v2 milestone seeding on escrow creation to avoid missing initialization-time logs.
- Version-aware watchers for legacy vs v2 milestone escrows.

Not yet covered:

- Reorg-safe indexing strategy with backfilling and finality windows.
- Coverage for all escrow types and full event surfaces.

### Layer 3: API security (auth, authorization, abuse prevention)

Implemented:

- SIWE-based session auth and `GET /api/v1/auth/session` for session validation.
- Wallet owner enforcement for `/users/:address/*` endpoints (server-side, not UI-only).
- API key hashing at rest (SHA-256) and one-time secret return.
- Helmet security headers, strict CORS, and global request validation (whitelist + forbid unknown fields).
- Global rate limiting via Nest Throttler.

Not yet covered:

- Fine-grained scopes/permissions for API keys (read vs write vs admin).
- Audit logging for sensitive admin operations.

### Layer 4: Supply chain and release safety (breaking change prevention)

Implemented:

- CI verifies protocol generation doesn't drift from committed `generated.ts`.
- Build/test checks across contracts, API, dapp, and SDK.

Not yet covered:

- Wallet-driven browser e2e (Playwright/Synpress) as a release gate.

## License

MIT. See `LICENSE`.
