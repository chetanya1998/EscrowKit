# EscrowKit Product Spec and Technical Architecture

## 1. Executive Summary

EscrowKit should evolve from a contract-centric prototype into a complete escrow infrastructure platform with four product surfaces:

- Hosted application for buyers, sellers, freelancers, landlords, tenants, vendors, and operators.
- Public developer API for backend-to-backend integrations.
- SDKs for frontend and backend developers embedding escrow into their own products.
- Embedded UI components and hosted workflows for checkout, approvals, evidence, and disputes.

The long-term product should support two classes of users:

- Direct users who manage escrows inside EscrowKit.
- Platforms that integrate EscrowKit into their own apps as an infrastructure layer.

The recommended product identity is:

- EscrowKit is the system of record for escrow orchestration.
- Smart contracts remain the settlement layer.
- The platform API, SDKs, and hosted app are the experience layer.

## 2. Problem Statement

The current repository proves core contract flows, but it is not yet a product-grade platform because:

- The SDK is a thin contract wrapper, not a stable integration product.
- The API is still mostly a read-model and user-facing backend, not a public platform contract.
- The frontend contains protocol orchestration logic that belongs in shared SDK and backend services.
- The indexer is event-driven but not yet a full ledger, workflow, and reconciliation system.
- Multi-tenancy, developer experience, webhooks, audit logs, notifications, operations, and embedded flows are incomplete.

## 3. Product Goals

- Make EscrowKit usable as a complete hosted product.
- Make EscrowKit integrable as an SDK and API platform.
- Make milestone escrow the first production-grade vertical, then generalize.
- Preserve contract-first architecture while making the application reliable for product teams.
- Give developers multiple integration paths without forcing them into one mode.

## 4. Non-Goals for the First Product Rebuild

- Full parity across every escrow type on day one.
- Multi-chain support before a stable single-chain product exists.
- Advanced enterprise billing before developer and hosted product flows are stable.
- Deep AI automation beyond basic verification, routing, and notification assistance.

## 5. Target Users and Personas

### 5.1 Direct Product Users

- Freelancer and client managing milestone-based project payments.
- Landlord and tenant using deposit escrow.
- Buyer and vendor using invoice and approval escrow.
- Internal operator or admin reviewing disputes, evidence, and system activity.

### 5.2 Developer and Platform Users

- Startup founder integrating escrow into a marketplace or service app.
- Product engineer embedding milestone checkout or approval steps.
- Backend engineer automating escrow lifecycle through API and webhooks.
- Platform team requiring sandbox, production keys, observability, and auditability.

## 6. Product Surfaces

### 6.1 Hosted App

The hosted product is the reference experience for all user roles.

Core capabilities:

- Onboarding and organization setup.
- Escrow creation and management.
- Counterparty collaboration.
- Funding and approvals.
- Evidence and disputes.
- Analytics, developer settings, and billing.

### 6.2 Public API

The public API must be stable, versioned, idempotent, documented, and multi-tenant.

Core capabilities:

- Create and manage escrows.
- Prepare lifecycle actions.
- Retrieve current state and event history.
- Upload documents and evidence.
- Configure webhooks and integration settings.
- Query analytics and operational data.

### 6.3 SDKs

SDKs must make common flows easier than direct contract integration.

Core capabilities:

- Domain models and typed clients.
- Transaction preparation and execution.
- Event waiters and receipt parsing.
- Token approval helpers.
- Version-aware protocol adapters.
- Embedded React components for common escrow workflows.

### 6.4 Embedded and Hosted Workflows

Some integrators do not want to build their own UI.

EscrowKit should support:

- Hosted checkout pages.
- Hosted counterparty portal links.
- Embedded modal or drawer components.
- Embedded timeline and status widgets.
- Hosted dispute and evidence upload flows.

## 7. Product Modes

EscrowKit should support multiple integration modes:

- `Hosted mode`: users live entirely inside EscrowKit.
- `API-first mode`: integrator owns the UI and calls EscrowKit APIs.
- `SDK-first mode`: integrator uses EscrowKit SDK packages to interact directly with chain and platform services.
- `Embedded mode`: integrator uses EscrowKit widgets or hosted routes inside their own app.
- `White-label mode`: enterprise partner receives branded hosted experience and tenant isolation.

## 8. Core Product Journeys

### 8.1 Create Escrow

- Choose org and project.
- Select template or custom flow.
- Define participants.
- Define milestones or escrow terms.
- Choose token and network.
- Review fees, rules, and dispute settings.
- Prepare transaction.
- Execute transaction.
- Land on escrow detail page with live timeline.

### 8.2 Fund Escrow

- Detect native or ERC-20 payment mode.
- Check allowance.
- If needed, execute approval step.
- Execute fund step.
- Confirm on-chain settlement.
- Update hosted timeline and fire webhook events.

### 8.3 Submit and Approve Milestone

- Payee submits deliverable or external proof.
- Payer receives in-app and webhook notification.
- Payer approves, requests changes, refunds, or opens dispute.
- Timeline, event history, and analytics update consistently.

### 8.4 Dispute Lifecycle

- Open dispute.
- Upload evidence and supporting documents.
- Notify counterparties and operator or arbiter.
- Resolve on-chain.
- Persist audit trail, ruling summary, and webhook event.

### 8.5 Developer Integration Journey

- Create org.
- Create project.
- Generate sandbox API key.
- Install SDK or call REST API.
- Use test integration example.
- Configure webhook endpoint.
- Move to production.
- Observe transaction and webhook logs in developer console.

## 9. Functional Requirements

### 9.1 Escrow Domain

- Support milestone escrow as the primary production flow.
- Represent state with a normalized domain model rather than contract-only structs.
- Support details documents, evidence, dispute metadata, and timeline summaries.
- Make protocol versioning invisible to normal product users.

### 9.2 Identity and Multi-Tenancy

- Organizations.
- Projects.
- Environments such as sandbox and production.
- Memberships and roles.
- Wallet linkage.
- API keys and secret rotation.
- Audit logs.

### 9.3 Platform Features

- Webhooks with signatures and retries.
- Notifications.
- Analytics and reporting.
- Search and filters.
- Idempotent create and action endpoints.
- Import and backfill tools.
- Observability and delivery logs.

## 10. Public API v1 Route Inventory

### 10.1 Auth and Identity

- `GET /v1/auth/nonce`
- `POST /v1/auth/verify`
- `GET /v1/auth/session`
- `POST /v1/auth/logout`

### 10.2 Organizations and Projects

- `GET /v1/orgs`
- `POST /v1/orgs`
- `GET /v1/orgs/:orgId`
- `PATCH /v1/orgs/:orgId`
- `GET /v1/orgs/:orgId/members`
- `POST /v1/orgs/:orgId/members`
- `GET /v1/projects`
- `POST /v1/projects`
- `GET /v1/projects/:projectId`
- `PATCH /v1/projects/:projectId`
- `GET /v1/projects/:projectId/environments`

### 10.3 API Keys and Webhooks

- `GET /v1/api-keys`
- `POST /v1/api-keys`
- `DELETE /v1/api-keys/:keyId`
- `GET /v1/webhooks`
- `POST /v1/webhooks`
- `PATCH /v1/webhooks/:webhookId`
- `DELETE /v1/webhooks/:webhookId`
- `GET /v1/webhook-deliveries`
- `POST /v1/webhooks/:webhookId/replay`

### 10.4 Escrows

- `GET /v1/escrows`
- `POST /v1/escrows`
- `GET /v1/escrows/:escrowId`
- `PATCH /v1/escrows/:escrowId`
- `GET /v1/escrows/:escrowId/milestones`
- `GET /v1/escrows/:escrowId/events`
- `GET /v1/escrows/:escrowId/disputes`

### 10.5 Action Preparation

- `POST /v1/escrows/actions/prepare-create`
- `POST /v1/escrows/:escrowId/actions/prepare-fund`
- `POST /v1/escrows/:escrowId/actions/prepare-approve`
- `POST /v1/escrows/:escrowId/actions/prepare-refund`
- `POST /v1/escrows/:escrowId/actions/prepare-submit`
- `POST /v1/escrows/:escrowId/actions/prepare-dispute`

### 10.6 Documents and Evidence

- `POST /v1/documents`
- `GET /v1/documents/:documentId`
- `POST /v1/evidence`
- `GET /v1/evidence/:evidenceId`

### 10.7 Analytics and Operations

- `GET /v1/analytics/overview`
- `GET /v1/analytics/escrows`
- `GET /v1/events`
- `GET /v1/health`
- `GET /v1/admin/audit-logs`

## 11. SDK Product Strategy

### 11.1 Package Split

- `@escrowkit/core`
- `@escrowkit/evm`
- `@escrowkit/react`
- `@escrowkit/server`

### 11.2 Responsibilities

`@escrowkit/core`

- API client.
- Domain types.
- Shared errors.
- Environment config.
- Pagination and webhook models.

`@escrowkit/evm`

- Contract adapters.
- Version-aware lifecycle actions.
- Token approval helpers.
- Transaction waiters.
- Receipt and event parsing.

`@escrowkit/react`

- Provider.
- Hooks.
- Embedded components.
- Hosted portal launchers.

`@escrowkit/server`

- Webhook verification.
- Idempotency helpers.
- Action preparation helpers.
- Secure backend integration helpers.

### 11.3 SDK Functional Requirements

- Typed create, get, list, and action methods.
- Stable error model.
- Browser-safe and server-safe usage.
- Read via API and write via chain when needed.
- Optional fully hosted mode.
- Example apps for Next.js, Node, Express, and serverless.
- Full automated test coverage.

## 12. Frontend Product Architecture

### 12.1 Frontend Surfaces

- Marketing site.
- Hosted dashboard app.
- Counterparty portal.
- Developer console.
- Embedded UI package.

### 12.2 Route Map

- `/`
- `/pricing`
- `/docs`
- `/developers`
- `/developers/api-keys`
- `/developers/webhooks`
- `/developers/logs`
- `/onboarding`
- `/orgs/:orgId`
- `/projects/:projectId`
- `/escrows`
- `/escrows/:escrowId`
- `/escrows/:escrowId/timeline`
- `/escrows/:escrowId/documents`
- `/escrows/:escrowId/dispute`
- `/disputes/:disputeId`
- `/counterparty/:inviteToken`
- `/settings/profile`
- `/settings/security`
- `/settings/billing`
- `/admin`

### 12.3 Frontend Design Principles

- UI should consume product APIs and SDK hooks, not raw contract heuristics.
- All transaction flows should use a shared action state machine.
- Timeline, documents, notifications, and disputes should be first-class modules.
- Hosted app and embedded components should share the same domain layer and design system.

## 13. Backend and Service Architecture

### 13.1 Services

- `Identity Service`
- `Escrow Service`
- `Action Orchestrator`
- `Ledger and Indexing Service`
- `Webhook Service`
- `Notification Service`
- `Document and Evidence Service`
- `Analytics Service`
- `Admin and Audit Service`

### 13.2 Core Principles

- Public API and hosted app should not depend on raw chain reads for every screen.
- Chain writes should be explicit and observable.
- All side effects should be idempotent.
- State transitions should be driven by ledger and reconciliation jobs, not only UI assumptions.
- Webhooks and notifications should be event-driven through an outbox pattern.

## 14. Data Model Rebuild

The current schema should evolve to include:

- `Organization`
- `Project`
- `Environment`
- `Membership`
- `WalletLink`
- `ApiKey`
- `Webhook`
- `WebhookDelivery`
- `Escrow`
- `EscrowParticipant`
- `Milestone`
- `Document`
- `Evidence`
- `Dispute`
- `Event`
- `Notification`
- `AuditLog`
- `Integration`

Key product requirements:

- tenant isolation
- additive versioned schemas
- strong auditability
- delivery logs
- lifecycle timestamps
- search-friendly denormalized summaries

## 15. Eventing and Jobs

Platform events should include:

- `escrow.created`
- `escrow.funded`
- `milestone.submitted`
- `milestone.approved`
- `milestone.refunded`
- `dispute.opened`
- `dispute.resolved`
- `document.uploaded`
- `webhook.delivery.failed`

Background jobs should include:

- chain indexing
- reconciliation
- stale escrow checks
- webhook retries
- notification fanout
- analytics aggregation
- document cleanup and retention

## 16. Security and Reliability Requirements

- JWT session auth for hosted app.
- scoped API keys for developer access.
- wallet ownership verification.
- organization and project RBAC.
- webhook HMAC signatures.
- idempotency keys on mutating endpoints.
- audit logs for privileged actions.
- encryption for secrets and document metadata.
- rate limiting.
- environment isolation between sandbox and production.
- replay-safe event processing.
- monitoring, tracing, and alerting.

## 17. Monorepo Target Layout

Recommended target workspace layout:

- `apps/dashboard`
- `apps/docs`
- `packages/protocol`
- `packages/sdk-core`
- `packages/sdk-evm`
- `packages/sdk-react`
- `packages/sdk-server`
- `services/api`
- `services/indexer`
- `services/worker`

This can be adopted incrementally without a full rename on day one, but the service and package boundaries should follow this shape.

## 18. Release Phases

### Phase 1: Platform Foundation

- freeze protocol interfaces
- define public API contract
- redesign schema for orgs, projects, environments
- implement idempotency, audit logs, webhooks, and sandbox model

### Phase 2: SDK and Developer Platform

- rebuild TypeScript SDK family
- ship developer console
- ship webhook tooling and examples
- publish integration guides

### Phase 3: Hosted Product Rebuild

- rebuild dashboard on product APIs
- add counterparty portal
- add notifications, documents, evidence, and disputes
- add analytics and operational visibility

### Phase 4: Embedded and Enterprise

- embedded checkout and approval components
- white-label support
- tenant theming
- enterprise controls and billing

## 19. 12-Week Execution Roadmap

### Weeks 1-2

- finalize product scope
- write OpenAPI v1
- redesign Prisma schema
- define SDK package boundaries

### Weeks 3-4

- implement orgs, projects, environments, and API keys
- implement webhook model and delivery pipeline
- build action preparation endpoints

### Weeks 5-6

- rebuild SDK core and EVM packages
- add examples and tests
- expose milestone escrow end-to-end through API and SDK

### Weeks 7-8

- rebuild frontend shell and dashboard information architecture
- ship create, fund, submit, approve, refund, and dispute flows on top of new APIs

### Weeks 9-10

- add developer console
- add webhook logs, analytics, and notification center
- add counterparty portal

### Weeks 11-12

- stabilize docs and examples
- add embedded components
- harden ops, observability, and runbooks
- prepare public beta

## 20. Definition of Done for "Complete Product"

EscrowKit should only be considered a complete product when:

- a direct customer can use the hosted app end to end
- a developer can integrate through SDK or API without reading contract code
- a platform can monitor webhooks, retries, analytics, and delivery logs
- state is consistent between chain, ledger, API, and UI
- docs, examples, and sandbox support exist
- auth, tenancy, auditability, and support operations are in place

## 21. Recommended Next Implementation Slice

The highest-leverage next build is:

- define OpenAPI v1
- redesign schema for orgs, projects, environments, and integrations
- rebuild `sdk-ts` into a real SDK foundation

That slice unlocks both hosted product rebuild and developer platform work without duplicating business logic.
