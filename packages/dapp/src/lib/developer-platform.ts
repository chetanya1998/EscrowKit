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

export const DEFAULT_WEBHOOK_EVENT_SUGGESTIONS = [
  "escrow.created",
  "escrow.funded",
  "milestone.submitted",
  "milestone.approved",
  "milestone.refunded",
  "dispute.created",
  "dispute.resolved",
];

export function toScopeFilters(
  kind: ScopeKind | null,
  ids: ScopeFilters,
): ScopeFilters {
  if (kind === "environment" && ids.environmentId) {
    return { environmentId: ids.environmentId };
  }

  if (kind === "project" && ids.projectId) {
    return { projectId: ids.projectId };
  }

  if (kind === "organization" && ids.organizationId) {
    return { organizationId: ids.organizationId };
  }

  return {};
}

export function getScopeOptions(params: {
  organization?: Organization | null;
  project?: Project | null;
  environment?: ProjectEnvironment | null;
}): ApiKeyScopeOption[] {
  const options: ApiKeyScopeOption[] = [];

  if (params.organization) {
    options.push({
      kind: "organization",
      id: params.organization.id,
      label: `${params.organization.name} org`,
      description: "Reusable across all projects in this organization",
    });
  }

  if (params.project) {
    options.push({
      kind: "project",
      id: params.project.id,
      label: `${params.project.name} project`,
      description: "Scoped to this project across its environments",
    });
  }

  if (params.environment) {
    options.push({
      kind: "environment",
      id: params.environment.id,
      label: `${params.environment.name} environment`,
      description: "Most restrictive scope for runtime-specific access",
    });
  }

  return options;
}

export function formatScopeLabel(entity: {
  organization?: TenantSummary | null;
  project?: TenantSummary | null;
  environment?: EnvironmentSummary | null;
}): string {
  if (entity.environment) {
    return `${entity.project?.name ?? "Project"} / ${entity.environment.name}`;
  }

  if (entity.project) {
    return entity.project.name;
  }

  if (entity.organization) {
    return entity.organization.name;
  }

  return "Unscoped";
}
