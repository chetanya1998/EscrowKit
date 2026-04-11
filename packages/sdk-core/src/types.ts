export type MembershipRole = "OWNER" | "ADMIN" | "DEVELOPER" | "VIEWER";

export type ProjectEnvironmentType = "SANDBOX" | "PRODUCTION";

export type WebhookDeliveryStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "RETRYING";

export type ScopeKind = "organization" | "project" | "environment";

export type ScopeFilters = {
  organizationId?: string;
  projectId?: string;
  environmentId?: string;
};

export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
};

export type EnvironmentSummary = TenantSummary & {
  type: ProjectEnvironmentType;
};

export type Organization = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  role?: MembershipRole;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  counts?: {
    apiKeys: number;
    members: number;
    projects: number;
    webhooks: number;
  };
};

export type OrganizationMember = {
  id: string;
  role: MembershipRole;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    address: string;
    username: string | null;
    email: string | null;
    avatar: string | null;
  };
};

export type OrganizationMembersResponse = {
  organization: Organization;
  members: OrganizationMember[];
};

export type ProjectEnvironment = {
  id: string;
  projectId: string;
  slug: string;
  name: string;
  type: ProjectEnvironmentType;
  role?: MembershipRole;
  baseUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  project: TenantSummary;
  organization?: TenantSummary;
};

export type Project = {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  description: string | null;
  role?: MembershipRole;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  organization: TenantSummary;
  environments?: ProjectEnvironment[];
  counts?: {
    apiKeys: number;
    environments: number;
    escrows: number;
    webhooks: number;
  };
};

export type ApiKey = {
  id: string;
  name: string;
  description: string | null;
  scopes: string[];
  metadata: Record<string, unknown> | null;
  maskedKey: string;
  prefix: string;
  lastFour: string;
  organizationId: string | null;
  projectId: string | null;
  environmentId: string | null;
  isActive: boolean;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  organization: TenantSummary | null;
  project: TenantSummary | null;
  environment: EnvironmentSummary | null;
  key?: string;
};

export type Webhook = {
  id: string;
  url: string;
  events: string[];
  description: string | null;
  headers: Record<string, string> | null;
  organizationId: string | null;
  projectId: string | null;
  environmentId: string | null;
  isActive: boolean;
  secretLastFour: string | null;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
  organization: TenantSummary | null;
  project: TenantSummary | null;
  environment: EnvironmentSummary | null;
  deliveryCount?: number;
  secret?: string;
};

export type WebhookDelivery = {
  id: string;
  event: string;
  status: WebhookDeliveryStatus;
  attemptCount: number;
  requestId: string | null;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string | null;
  projectId: string | null;
  environmentId: string | null;
  payload: Record<string, unknown>;
  webhook: {
    id: string;
    url: string;
    description: string | null;
  };
};

export type ApiKeyScopeOption = {
  kind: ScopeKind;
  id: string;
  label: string;
  description: string;
};

export type Milestone = {
  id: string;
  escrowAddress: string;
  index: number;
  amount: string;
  description: string;
  deadline: string | null;
  status: string;
  deliverableHash: string | null;
  disputeId: string | null;
  conditionHash: string | null;
  isVerified: boolean;
};

export type Event = {
  id: string;
  escrowAddress: string;
  eventName: string;
  blockNumber: string;
  logIndex: number;
  transactionHash: string;
  args: Record<string, unknown>;
  createdAt: string;
};

export type Dispute = {
  id: string;
  escrowAddress: string;
  milestoneIndex: number;
  disputeIdOnChain: string;
  status: string;
  reason: string | null;
  createdAt: string;
};

export type Escrow = {
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
  organizationId: string | null;
  projectId: string | null;
  environmentId: string | null;
  externalReference: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  milestones?: Milestone[];
  events?: Event[];
  disputes?: Dispute[];
};
