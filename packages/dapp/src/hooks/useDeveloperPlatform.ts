"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  ApiKey,
  Organization,
  OrganizationMembersResponse,
  Project,
  ProjectEnvironment,
  ScopeFilters,
  Webhook,
  WebhookDelivery,
  Escrow,
} from "@/lib/developer-platform";
import { API_BASE_URL, authFetch } from "@/lib/utils";

const developerQueryKey = (...segments: unknown[]) =>
  ["developer-platform", ...segments] as const;

async function getErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as
      | { message?: string | string[]; error?: string }
      | null;

    if (Array.isArray(data?.message)) {
      return data.message.join(", ");
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.error === "string") {
      return data.error;
    }
  }

  const text = await response.text().catch(() => "");
  return text || `Request failed with status ${response.status}`;
}

async function platformRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await authFetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function buildQueryString(filters: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function useDeveloperOrganizations(enabled: boolean) {
  return useQuery({
    queryKey: developerQueryKey("organizations"),
    queryFn: () => platformRequest<Organization[]>("/api/v1/orgs"),
    enabled,
    staleTime: 60_000,
  });
}

export function useDeveloperOrganizationMembers(
  organizationId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: developerQueryKey("organization-members", organizationId),
    queryFn: () =>
      platformRequest<OrganizationMembersResponse>(
        `/api/v1/orgs/${organizationId}/members`,
      ),
    enabled: enabled && Boolean(organizationId),
    staleTime: 60_000,
  });
}

export function useDeveloperProjects(
  organizationId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: developerQueryKey("projects", organizationId ?? "all"),
    queryFn: () =>
      platformRequest<Project[]>(
        `/api/v1/projects${buildQueryString({ organizationId })}`,
      ),
    enabled,
    staleTime: 60_000,
  });
}

export function useDeveloperProjectEnvironments(
  projectId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: developerQueryKey("environments", projectId),
    queryFn: () =>
      platformRequest<ProjectEnvironment[]>(
        `/api/v1/projects/${projectId}/environments`,
      ),
    enabled: enabled && Boolean(projectId),
    staleTime: 60_000,
  });
}

export function useDeveloperApiKeys(filters: ScopeFilters, enabled: boolean) {
  return useQuery({
    queryKey: developerQueryKey("api-keys", filters),
    queryFn: () =>
      platformRequest<ApiKey[]>(
        `/api/v1/api-keys${buildQueryString({
          organizationId: filters.organizationId,
          projectId: filters.projectId,
          environmentId: filters.environmentId,
        })}`,
      ),
    enabled,
    staleTime: 30_000,
  });
}

export function useDeveloperWebhooks(filters: ScopeFilters, enabled: boolean) {
  return useQuery({
    queryKey: developerQueryKey("webhooks", filters),
    queryFn: () =>
      platformRequest<Webhook[]>(
        `/api/v1/webhooks${buildQueryString({
          organizationId: filters.organizationId,
          projectId: filters.projectId,
          environmentId: filters.environmentId,
        })}`,
      ),
    enabled,
    staleTime: 30_000,
  });
}

export function useDeveloperWebhookDeliveries(
  filters: ScopeFilters & {
    webhookId?: string;
    take?: number;
  },
  enabled: boolean,
) {
  return useQuery({
    queryKey: developerQueryKey("webhook-deliveries", filters),
    queryFn: () =>
      platformRequest<WebhookDelivery[]>(
        `/api/v1/webhook-deliveries${buildQueryString({
          organizationId: filters.organizationId,
          projectId: filters.projectId,
          environmentId: filters.environmentId,
          webhookId: filters.webhookId,
          take: filters.take,
        })}`,
      ),
    enabled,
    staleTime: 15_000,
  });
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      platformRequest<Organization>("/api/v1/orgs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Organization created");
      await queryClient.invalidateQueries({
        queryKey: developerQueryKey(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAddOrganizationMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      organizationId: string;
      walletAddress: string;
      role: string;
    }) =>
      platformRequest<OrganizationMembersResponse>(
        `/api/v1/orgs/${payload.organizationId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: payload.walletAddress,
            role: payload.role,
          }),
        },
      ),
    onSuccess: async () => {
      toast.success("Team member updated");
      await queryClient.invalidateQueries({
        queryKey: developerQueryKey(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      organizationId: string;
      name: string;
      description?: string;
    }) =>
      platformRequest<Project>("/api/v1/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Project created");
      await queryClient.invalidateQueries({
        queryKey: developerQueryKey(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      projectId: string;
      name?: string;
      description?: string;
    }) =>
      platformRequest<Project>(`/api/v1/projects/${payload.projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
        }),
      }),
    onSuccess: async () => {
      toast.success("Project updated");
      await queryClient.invalidateQueries({
        queryKey: developerQueryKey(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateProjectEnvironmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      projectId: string;
      name: string;
      type: "SANDBOX" | "PRODUCTION";
      baseUrl?: string;
    }) =>
      platformRequest<ProjectEnvironment>(
        `/api/v1/projects/${payload.projectId}/environments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: payload.name,
            type: payload.type,
            baseUrl: payload.baseUrl,
          }),
        },
      ),
    onSuccess: async () => {
      toast.success("Environment created");
      await queryClient.invalidateQueries({
        queryKey: developerQueryKey(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateApiKeyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name: string;
      description?: string;
      organizationId?: string;
      projectId?: string;
      environmentId?: string;
      scopes?: string[];
    }) =>
      platformRequest<ApiKey>("/api/v1/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("API key created");
      await queryClient.invalidateQueries({
        queryKey: developerQueryKey(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRevokeApiKeyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { keyId: string }) =>
      platformRequest<ApiKey>(`/api/v1/api-keys/${payload.keyId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      toast.success("API key revoked");
      await queryClient.invalidateQueries({
        queryKey: developerQueryKey(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateWebhookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      url: string;
      events: string[];
      secret?: string;
      description?: string;
      headers?: Record<string, string>;
      organizationId?: string;
      projectId?: string;
      environmentId?: string;
    }) =>
      platformRequest<Webhook>("/api/v1/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Webhook created");
      await queryClient.invalidateQueries({
        queryKey: developerQueryKey(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateWebhookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      webhookId: string;
      url?: string;
      events?: string[];
      secret?: string;
      description?: string;
      headers?: Record<string, string>;
      isActive?: boolean;
    }) =>
      platformRequest<Webhook>(`/api/v1/webhooks/${payload.webhookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: payload.url,
          events: payload.events,
          secret: payload.secret,
          description: payload.description,
          headers: payload.headers,
          isActive: payload.isActive,
        }),
      }),
    onSuccess: async () => {
      toast.success("Webhook updated");
      await queryClient.invalidateQueries({
        queryKey: developerQueryKey(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useArchiveWebhookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { webhookId: string }) =>
      platformRequest<Webhook>(`/api/v1/webhooks/${payload.webhookId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      toast.success("Webhook archived");
      await queryClient.invalidateQueries({
        queryKey: developerQueryKey(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useReplayWebhookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { webhookId: string; deliveryId?: string }) =>
      platformRequest<{
        id: string;
        status: string;
      }>(`/api/v1/webhooks/${payload.webhookId}/replay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryId: payload.deliveryId,
        }),
      }),
    onSuccess: async () => {
      toast.success("Webhook replay queued");
      await queryClient.invalidateQueries({
        queryKey: developerQueryKey(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeveloperEscrows(filters: ScopeFilters, enabled: boolean) {
  return useQuery({
    queryKey: developerQueryKey("escrows", filters),
    queryFn: () =>
      platformRequest<Escrow[]>(
        `/api/v1/escrows${buildQueryString({
          environmentId: filters.environmentId,
          projectId: filters.projectId,
        })}`,
      ),
    enabled,
    staleTime: 15_000,
  });
}

export function useDeveloperEscrow(escrowId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: developerQueryKey("escrow", escrowId),
    queryFn: () => platformRequest<Escrow>(`/api/v1/escrows/${escrowId}`),
    enabled: enabled && Boolean(escrowId),
    staleTime: 15_000,
  });
}
