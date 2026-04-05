# Public Platform Contract

This document defines the current public HTTP contract for EscrowKit’s platform layer: auth, indexed read APIs, transaction-helper APIs, API keys, webhooks, evidence storage, and milestone drafting.

This contract is separate from the on-chain ABI contract in `packages/protocol`.

## Scope

This document covers:

- Public HTTP endpoints exposed by `packages/api`
- Authentication methods and ownership rules
- Request and response shapes that external consumers can depend on
- Compatibility rules for versioned vs legacy routes
- Webhook signing and payload semantics

This document does not cover:

- Solidity ABI details
- Frontend-only route behavior in `packages/dapp`
- Internal database implementation details beyond externally visible fields

## Base URL

Local development:

```text
http://localhost:3001
```

Production and staging deployments may use different hosts, but the path contract below remains the same.

## Stability Tiers

### Stable, versioned surface

Routes under `/api/v1/...` are the stable public platform contract.

Compatibility guarantees:

- Existing fields will not be renamed or removed inside the same major API version.
- New fields may be added to existing response objects.
- New endpoints may be added under `/api/v1/...`.
- Breaking changes require a new versioned path.

### Current public, not yet versioned

The following routes are currently public but should be treated as transitional:

- `/escrows/...`
- `/users/...`
- `/evidence/...`

These are usable today, but they do not yet have the same long-term stability promise as `/api/v1/...`.

## Authentication Contract

### API key authentication

Used by:

- `/api/v1/escrows`
- `/api/v1/transactions/*`
- `/api/v1/webhooks/*`

Header:

```http
x-api-key: sk_...
```

Behavior:

- Missing key returns `401 Unauthorized`.
- Invalid or inactive key returns `401 Unauthorized`.
- API keys are owner-scoped.

### Wallet session authentication

Used by:

- `/api/v1/auth/session`
- `/users/:address/...`

Header:

```http
Authorization: Bearer <session-token>
```

Behavior:

- Session tokens are issued after SIWE verification.
- Current session TTL is 7 days.
- Access to `/users/:address/...` is restricted to the same wallet address as the authenticated session.
- Mismatched wallet address returns `403 Forbidden`.

### Public endpoints

No auth required today for:

- `/escrows/...`
- `/evidence/...`
- `/api/v1/drafts/...`
- `/api/v1/disputes/evidence`

`POST /api/v1/disputes/webhook/ruling` is currently unauthenticated in code and should be treated as an internal integration callback until a stronger auth contract is added.

## Cross-Cutting Contract Rules

- Ethereum addresses are represented as lowercase or checksummed `0x...` strings. Consumers must compare addresses case-insensitively.
- Large integers are represented as JSON strings when serialized for public responses.
- `DateTime` fields are returned as ISO-8601 strings.
- Unknown object fields must be ignored by clients.
- Global rate limiting is currently `100` requests per minute per client process, enforced at the API layer.

## Canonical Resource Shapes

The shapes below define the minimum field contract clients can rely on. Additive fields may appear over time.

### EscrowSummary

```ts
type EscrowSummary = {
  id: string;
  address: string;
  payer: string;
  payee: string;
  arbiter: string | null;
  arbitrationAdapter: string | null;
  factoryAddress: string;
  adminAddress: string | null;
  chainId: number | null;
  escrowType: string | null;
  protocolVersion: number | null;
  tokenAddress: string | null;
  detailsHash: string | null;
  createdTxHash: string | null;
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
};
```

### EscrowDetail

```ts
type EscrowDetail = EscrowSummary & {
  disputes: Dispute[];
  events: Event[];
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

### Dispute

```ts
type Dispute = {
  id: string;
  escrowAddress: string;
  milestoneIndex: number;
  disputeIdOnChain: string;
  status: "OPEN" | "RESOLVED";
  reason: string | null;
  createdAt: string;
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

### UserProfile

```ts
type UserProfile = {
  id: string;
  address: string;
  username: string | null;
  email: string | null;
  bio: string | null;
  avatar: string | null;
  preferences: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};
```

### ApiKeyRecord

```ts
type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  lastFour: string;
  maskedKey: string;
  createdAt: string;
};
```

### WebhookRecord

```ts
type WebhookRecord = {
  id: string;
  url: string;
  secret: string;
  events: string[];
  ownerId: string;
  isActive: boolean;
  createdAt: string;
};
```

## Endpoint Contract

### Session and auth

#### `GET /api/v1/auth/nonce`

Auth: none

Response:

```json
{
  "nonce": "string",
  "nonceToken": "string"
}
```

#### `POST /api/v1/auth/verify`

Auth: none

Body:

```json
{
  "message": "string",
  "signature": "0x...",
  "nonceToken": "string"
}
```

Response:

```json
{
  "token": "string"
}
```

#### `GET /api/v1/auth/session`

Auth: bearer session token

Response:

```json
{
  "walletAddress": "0x...",
  "valid": true,
  "expiresAt": "2026-04-12T12:00:00.000Z"
}
```

### Stable escrow read model

#### `GET /api/v1/escrows`

Auth: API key

Returns escrows where the API key owner’s wallet address is the payer or payee.

Response:

```json
[
  {
    "id": "uuid",
    "address": "0xEscrow",
    "payer": "0xPayer",
    "payee": "0xPayee",
    "arbiter": "0xArbiter",
    "factoryAddress": "0xFactory",
    "milestones": []
  }
]
```

#### `GET /api/v1/escrows/:address`

Auth: API key

Response:

```json
{
  "id": "uuid",
  "address": "0xEscrow",
  "milestones": [],
  "disputes": [],
  "events": []
}
```

### Transaction helpers

#### `POST /api/v1/transactions/deploy`

Auth: API key

Body:

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

#### `POST /api/v1/transactions/release`

Auth: API key

Body:

```json
{
  "escrowAddress": "0x...",
  "milestoneId": 0
}
```

Response:

```json
{
  "to": "0xEscrowAddress",
  "data": "0x..."
}
```

### Webhooks

#### `POST /api/v1/webhooks`

Auth: API key

Body:

```json
{
  "url": "https://example.com/webhooks/escrowkit",
  "events": ["EscrowCreated", "MilestoneReleased"],
  "secret": "optional-shared-secret"
}
```

Response:

```json
{
  "id": "uuid",
  "url": "https://example.com/webhooks/escrowkit",
  "secret": "secret-value",
  "events": ["EscrowCreated", "MilestoneReleased"],
  "ownerId": "uuid",
  "isActive": true,
  "createdAt": "2026-04-05T00:00:00.000Z"
}
```

If `secret` is omitted, the platform generates one.

#### `GET /api/v1/webhooks`

Auth: API key

Response:

```json
[
  {
    "id": "uuid",
    "url": "https://example.com/webhooks/escrowkit",
    "secret": "secret-value",
    "events": ["EscrowCreated"],
    "ownerId": "uuid",
    "isActive": true,
    "createdAt": "2026-04-05T00:00:00.000Z"
  }
]
```

### Drafts and disputes

#### `POST /api/v1/drafts`

Auth: none today

Body:

```json
{
  "escrowAddress": "0x... optional",
  "index": 0,
  "title": "Design Phase",
  "description": "Create approved design system",
  "amount": "1000000000000000000",
  "deadline": "2026-05-01T00:00:00.000Z",
  "creator": "0xUser"
}
```

#### `GET /api/v1/drafts/:escrowAddress`

Auth: none today

Response: `MilestoneDraft[]`

#### `POST /api/v1/drafts/:id/sign`

Auth: none today

Body:

```json
{
  "signature": "0x...",
  "signer": "0x..."
}
```

#### `PATCH /api/v1/drafts/:id/reject`

Auth: none today

Response: updated draft

#### `POST /api/v1/disputes/evidence`

Auth: none today

Body:

```json
{
  "adapterAddress": "0x...",
  "disputeId": 1,
  "evidence": "ipfs://... or https://..."
}
```

Response:

```json
{
  "to": "0xAdapter",
  "data": "0x..."
}
```

#### `POST /api/v1/disputes/webhook/ruling`

Auth: internal callback, unauthenticated today

Body:

```json
{
  "disputeId": 1,
  "ruling": 1,
  "escrowAddress": "0x..."
}
```

Response:

```json
{
  "success": true
}
```

### Transitional public routes

#### `GET /escrows`

Auth: none

Query params:

- `party`: optional wallet address filter
- `role`: optional one of `payer`, `payee`, `admin`

Response: `EscrowSummary[]`

#### `GET /escrows/:address`

Auth: none

Response: `EscrowDetail | null`

#### `GET /escrows/:address/milestones`

Auth: none

Response: `Milestone[]`

#### `GET /escrows/:address/events`

Auth: none

Response: `Event[]`

#### `GET /escrows/:address/disputes`

Auth: none

Response: `Dispute[]`

### Wallet-scoped user routes

All `/users/:address/...` routes require:

- Bearer session auth
- `:address` equal to the authenticated wallet

#### `GET /users/:address`

Response: `UserProfile`

If the user does not exist yet, the platform may create a minimal profile record on first access.

#### `PATCH /users/:address`

Body:

```json
{
  "username": "optional",
  "email": "optional",
  "bio": "optional",
  "avatar": "optional",
  "preferences": {}
}
```

Response: `UserProfile`

#### `GET /users/:address/escrows`

Query params:

- `role`: optional escrow role filter
- `status`: optional milestone status filter

Response: `Array<EscrowSummary & { disputes: Dispute[] }>`

#### `GET /users/:address/stats`

Response:

```json
{
  "totalVolume": "0.0",
  "activeEscrows": 0,
  "completedEscrows": 0,
  "activeDisputes": 0,
  "disputeRate": "0%"
}
```

#### `GET /users/:address/analytics`

Response:

```json
{
  "totalVolume": "0",
  "activeEscrows": 0,
  "completedEscrows": 0,
  "disputeCount": 0,
  "escrowCount": 0
}
```

#### `POST /users/:address/keys`

Body:

```json
{
  "name": "Production backend"
}
```

Response:

```json
{
  "id": "uuid",
  "name": "Production backend",
  "key": "sk_...",
  "maskedKey": "sk_abcd...wxyz",
  "prefix": "sk_abcdefg",
  "lastFour": "wxyz",
  "createdAt": "2026-04-05T00:00:00.000Z"
}
```

The `key` field is only returned at creation time.

#### `GET /users/:address/keys`

Response: `ApiKeyRecord[]`

#### `DELETE /users/:address/keys/:keyId`

Response:

```json
{
  "count": 1
}
```

### Evidence storage

#### `POST /evidence/upload`

Auth: none

Content type:

```http
multipart/form-data
```

Form fields:

- `file`: required binary upload

Response:

```json
{
  "success": true,
  "hash": "sha256-hex",
  "url": "http://localhost:3000/evidence/<stored-filename>",
  "filename": "<stored-filename>"
}
```

#### `GET /evidence/:hash`

Auth: none

Returns the matching file stream if a stored filename starts with `:hash`.

## Webhook Delivery Contract

Outgoing webhooks are delivered as `POST` requests with:

Headers:

```http
Content-Type: application/json
X-EscrowKit-Event: <event-name>
X-EscrowKit-Signature: <hex-hmac-sha256>
```

Payload:

```json
{
  "event": "MilestoneReleased",
  "timestamp": 1775347200000,
  "data": {}
}
```

Signature algorithm:

- HMAC-SHA256
- secret: webhook secret
- message: raw JSON request body
- encoding: lowercase hex digest

Current event names are open-ended strings. Indexed protocol events currently include names such as:

- `EscrowCreated`
- `EscrowCreatedV2`
- `MilestoneFunded`
- `MilestoneReleased`

Consumers must ignore event names they do not recognize.

Retry behavior and delivery ordering are not yet a stable part of the public contract.

## Error Contract

The API currently uses standard NestJS HTTP error responses.

Consumers should expect JSON in this shape for framework-generated errors:

```json
{
  "statusCode": 401,
  "message": "Invalid or inactive API Key",
  "error": "Unauthorized"
}
```

Common status codes:

- `400` malformed request body or params
- `401` missing or invalid auth credentials
- `403` authenticated but not allowed for requested wallet/resource
- `404` resource not found
- `429` throttled by rate limiting
- `500` unexpected server error

Clients should not depend on exact phrasing of the `message` field.

## Change Policy

When evolving this contract:

- Prefer additive fields and additive endpoints.
- Do not reuse a field name with different semantics.
- Move breaking behavior behind a new versioned path.
- Promote unversioned public routes into `/api/v1/...` before tightening their guarantees.

## Source of Truth

Public platform contract:

- `API.md`
- `packages/docs/docs/api/reference.md`

Protocol and on-chain ABI contract:

- `packages/protocol/src/generated.ts`
- `packages/protocol/src/types.ts`
  string deliverableHash
  string conditionHash
  boolean isVerified
  }

  Dispute {
  string id PK
  string escrowAddress FK
  int milestoneIndex FK
  string disputeIdOnChain
  string status
  }

  Event {
  string id PK
  string escrowAddress FK
  string eventName
  int blockNumber
  json args
  }

  Webhook {
  string id PK
  string userId FK
  string url
  string secret
  boolean isActive
  }

```

```
