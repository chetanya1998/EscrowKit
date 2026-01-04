# Repository Plan & Structure

## Folder Structure
```
packages/
  ├── contracts/    # Solidity Smart Contracts (Foundry)
  ├── indexer/      # Event Indexer (Node.js + TypeScript + Viem)
  ├── api/          # Read API (NestJS + Prisma)
  ├── dapp/         # Frontend dApp (Next.js + Wagmi + Tailwind)
  ├── sdk-ts/       # TypeScript SDK (Viem wrapper)
  └── docs/         # Documentation (Docusaurus)
```

## Ownership & Responsibilities
- **Contracts**: Core logic, security, pure solidity.
- **Indexer**: Data consistency, catching up with chain, handling reorgs.
- **API**: Serving data fast, caching, auth (if any for evidence upload).
- **Dapp**: User experience, wallet connection, transaction lifecycle.
- **SDK**: Developer experience, types.

## Build Commands
Driven by Turborepo at the root.

- `pnpm install`: Install all dependencies.
- `pnpm build`: Build all packages.
- `pnpm dev`: Run all packages in dev mode (parallel).
- `pnpm test`: Run tests across packages.
- `pnpm lint`: Lint all packages.

### Sub-package commands
- **Contracts**: `forge build`, `forge test`.
- **Indexer**: `ts-node src/index.ts`.
- **API**: `nest start --watch`.
- **Dapp**: `next dev`.
- **Docs**: `docusaurus start`.
