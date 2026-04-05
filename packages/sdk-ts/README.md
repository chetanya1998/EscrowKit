# EscrowKit TypeScript SDK

`packages/sdk-ts` is the workspace TypeScript SDK for wallet-connected EscrowKit flows. It depends on `@escrowkit/protocol` for generated ABIs and deployment helpers, so rebuild the protocol package first whenever contract interfaces change.

## Exports

- `EscrowKitClient`
- `EscrowRecipes`
- `MilestoneStatus`
- `Milestone`
- `EscrowDetails`

## Rebuild

```bash
pnpm --filter @escrowkit/protocol build
pnpm --filter sdk-ts build
```

The SDK build emits:

- `dist/index.js` for ESM consumers
- `dist/index.cjs` for CommonJS consumers
- `dist/index.d.ts` for TypeScript types

## Usage

```ts
import { http } from 'viem';
import { foundry } from 'viem/chains';
import { EscrowKitClient } from 'sdk-ts';

const client = new EscrowKitClient({
  chain: foundry,
  transport: http('http://127.0.0.1:8545'),
  factoryAddress: '0x0000000000000000000000000000000000000000',
  walletClient,
});
```

## Current client surface

- `createEscrow(...)` creates v2 milestone escrows.
- `addMilestones(...)` targets legacy `MilestoneEscrowV1` contracts.
- `fund(...)` currently sends native token value.
- `submitDeliverable(...)` submits a milestone deliverable hash.
- `approveMilestone(...)` approves a submitted milestone.

`EscrowRecipes#createFreelanceFixPrice(...)` is the current convenience helper for a one-milestone fixed-price flow.
