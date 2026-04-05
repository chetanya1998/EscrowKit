# Public API Reference

This page mirrors the repo-level public platform contract in `API.md` and summarizes the EscrowKit HTTP surfaces external consumers can rely on.

## Base URL

Local development:

```text
http://localhost:3001
```

## Stability Model

- `/api/v1/...` is the stable, versioned public API.
- `/escrows/...`, `/users/...`, and `/evidence/...` are public today but transitional until they move under a versioned path.
- Additive fields may appear over time. Clients should ignore unknown fields.

## Auth Modes

### API key

Header:

```http
x-api-key: sk_...
```

Used by:

- `GET /api/v1/escrows`
- `GET /api/v1/escrows/:address`
- `POST /api/v1/transactions/deploy`
- `POST /api/v1/transactions/release`
- `POST /api/v1/webhooks`
- `GET /api/v1/webhooks`

### Wallet session

Header:

```http
Authorization: Bearer <session-token>
```

Used by:

- `GET /api/v1/auth/session`
- `/users/:address/...`

### Public

No auth required today for:

- `/escrows/...`
- `/evidence/...`
- `/api/v1/drafts/...`
- `POST /api/v1/disputes/evidence`

## Core Shapes

### Escrow

```ts
type Escrow = {
  id: string;
  address: string;
  payer: string;
  payee: string;
  arbiter: string | null;
  factoryAddress: string;
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
};
```

### Milestone

```ts
type Milestone = {
  id: string;
  escrowAddress: string;
  index: number;
  amount: string;
  description: string;
  deadline: string | null;
  status:
    | "PENDING"
    | "SUBMITTED"
    | "APPROVED"
    | "RELEASED"
    | "REFUNDED"
    | "DISPUTED";
  deliverableHash: string | null;
  disputeId: string | null;
  conditionHash: string | null;
  isVerified: boolean;
};
```

### Event

```ts
type Event = {
  id: string;
  escrowAddress: string;
  eventName: string;
  blockNumber: string;
  logIndex: number;
  transactionHash: string;
  args: Record<string, unknown>;
  createdAt: string;
};
```

## Stable `/api/v1` Surface

### Auth

- `GET /api/v1/auth/nonce`
- `POST /api/v1/auth/verify`
- `GET /api/v1/auth/session`

### Escrows

- `GET /api/v1/escrows`
- `GET /api/v1/escrows/:address`

### Transaction helpers

- `POST /api/v1/transactions/deploy`
- `POST /api/v1/transactions/release`

Deploy request body:

```json
{
  "payee": "0x...",
  "arbiter": "0x...",
  "arbitrationAdapter": "0x...",
  "verificationOracle": "0x...",
  "token": "0x...",
  "detailsHash": "0x...",
  "config": {
    "arbitrationFeeBps": "0",
    "payerPenaltyBps": "0",
    "payeePenaltyBps": "0",
    "disputeWindow": "0",
    "reviewPeriod": "0"
  },
  "milestones": [
    {
      "amount": "1000000000000000000",
      "description": "Milestone 1",
      "deadline": "1775347200",
      "conditionHash": "0x..."
    }
  ]
}
```

Response:

```json
{
  "to": "0xFactoryAddress",
  "data": "0x...",
  "value": "0"
}
```

### Webhooks

- `POST /api/v1/webhooks`
- `GET /api/v1/webhooks`

Webhook delivery headers:

```http
X-EscrowKit-Event: <event-name>
X-EscrowKit-Signature: <hex-hmac-sha256>
```

Webhook payload:

```json
{
  "event": "MilestoneReleased",
  "timestamp": 1775347200000,
  "data": {}
}
```

### Drafts and disputes

- `POST /api/v1/drafts`
- `GET /api/v1/drafts/:escrowAddress`
- `POST /api/v1/drafts/:id/sign`
- `PATCH /api/v1/drafts/:id/reject`
- `POST /api/v1/disputes/evidence`
- `POST /api/v1/disputes/webhook/ruling`

## Transitional Public Routes

### Read model

- `GET /escrows`
- `GET /escrows/:address`
- `GET /escrows/:address/milestones`
- `GET /escrows/:address/events`
- `GET /escrows/:address/disputes`

### Wallet-scoped user API

- `GET /users/:address`
- `PATCH /users/:address`
- `GET /users/:address/escrows`
- `GET /users/:address/stats`
- `GET /users/:address/analytics`
- `POST /users/:address/keys`
- `GET /users/:address/keys`
- `DELETE /users/:address/keys/:keyId`

### Evidence

- `POST /evidence/upload`
- `GET /evidence/:hash`

## Error Shape

Framework-generated errors currently follow NestJS defaults:

```json
{
  "statusCode": 401,
  "message": "Invalid or inactive API Key",
  "error": "Unauthorized"
}
```

## Notes

- Addresses should be compared case-insensitively.
- Large integers are serialized as strings in public responses.
- For the full endpoint-by-endpoint contract, see the repo root `API.md`.
