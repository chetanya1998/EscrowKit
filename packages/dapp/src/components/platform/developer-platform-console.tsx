"use client";

import * as React from "react";
import { useAccount } from "wagmi";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock3,
  Copy,
  FolderKanban,
  Globe,
  KeyRound,
  Loader2,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCcw,
  Rocket,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  Users,
  Webhook,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_WEBHOOK_EVENT_SUGGESTIONS,
  type MembershipRole,
  type ScopeKind,
  formatScopeLabel,
  getScopeOptions,
  toScopeFilters,
} from "@/lib/developer-platform";
import { AUTH_CHANGED_EVENT, getStoredAuthToken, shortenAddress } from "@/lib/utils";
import {
  useAddOrganizationMemberMutation,
  useArchiveWebhookMutation,
  useCreateApiKeyMutation,
  useCreateOrganizationMutation,
  useCreateProjectEnvironmentMutation,
  useCreateProjectMutation,
  useCreateWebhookMutation,
  useDeveloperApiKeys,
  useDeveloperOrganizationMembers,
  useDeveloperOrganizations,
  useDeveloperProjectEnvironments,
  useDeveloperProjects,
  useDeveloperWebhookDeliveries,
  useDeveloperWebhooks,
  useReplayWebhookMutation,
  useRevokeApiKeyMutation,
  useUpdateProjectMutation,
  useUpdateWebhookMutation,
} from "@/hooks/useDeveloperPlatform";

const EMPTY_SENTINEL = "__all";

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleDateString();
}

function parseCsvList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseHeaders(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = JSON.parse(value) as Record<string, unknown>;

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Headers must be a JSON object");
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([key, headerValue]) => [key, String(headerValue)]),
  );
}

function roleTone(role: MembershipRole | undefined) {
  switch (role) {
    case "OWNER":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
    case "ADMIN":
      return "bg-sky-500/10 text-sky-300 border-sky-500/20";
    case "DEVELOPER":
      return "bg-amber-500/10 text-amber-300 border-amber-500/20";
    default:
      return "bg-neutral-800 text-neutral-300 border-neutral-700";
  }
}

function deliveryTone(status: string) {
  switch (status) {
    case "SUCCESS":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
    case "FAILED":
      return "bg-red-500/10 text-red-300 border-red-500/20";
    case "RETRYING":
      return "bg-amber-500/10 text-amber-300 border-amber-500/20";
    default:
      return "bg-neutral-800 text-neutral-300 border-neutral-700";
  }
}

function environmentTone(type: string) {
  return type === "PRODUCTION"
    ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
    : "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-neutral-800 bg-neutral-900/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-300">{label}</CardTitle>
        <Icon className="h-4 w-4 text-emerald-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-neutral-50">{value}</div>
        <p className="mt-1 text-xs text-neutral-500">{description}</p>
      </CardContent>
    </Card>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-50">{title}</h2>
        </div>
        <p className="max-w-2xl text-sm text-neutral-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function DeveloperPlatformConsole() {
  const { address, isConnected } = useAccount();
  const [hasToken, setHasToken] = React.useState(false);

  const [selectedOrganizationId, setSelectedOrganizationId] = React.useState<string>();
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>();
  const [selectedEnvironmentId, setSelectedEnvironmentId] = React.useState<string>();
  const [viewKind, setViewKind] = React.useState<ScopeKind>("organization");

  const [createOrgOpen, setCreateOrgOpen] = React.useState(false);
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false);
  const [createEnvironmentOpen, setCreateEnvironmentOpen] = React.useState(false);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [createKeyOpen, setCreateKeyOpen] = React.useState(false);
  const [createWebhookOpen, setCreateWebhookOpen] = React.useState(false);
  const [editProjectOpen, setEditProjectOpen] = React.useState(false);

  const [organizationDraft, setOrganizationDraft] = React.useState({
    name: "",
    description: "",
  });
  const [projectDraft, setProjectDraft] = React.useState({
    name: "",
    description: "",
  });
  const [projectEditDraft, setProjectEditDraft] = React.useState({
    name: "",
    description: "",
  });
  const [environmentDraft, setEnvironmentDraft] = React.useState({
    name: "",
    type: "SANDBOX" as "SANDBOX" | "PRODUCTION",
    baseUrl: "",
  });
  const [memberDraft, setMemberDraft] = React.useState({
    walletAddress: "",
    role: "DEVELOPER",
  });
  const [apiKeyDraft, setApiKeyDraft] = React.useState({
    name: "",
    description: "",
    scopes: "",
  });
  const [webhookDraft, setWebhookDraft] = React.useState({
    url: "",
    events: "escrow.created",
    secret: "",
    description: "",
    headers: "",
  });
  const [keyScopeKind, setKeyScopeKind] = React.useState<ScopeKind>("organization");
  const [webhookScopeKind, setWebhookScopeKind] = React.useState<ScopeKind>("organization");
  const [generatedKey, setGeneratedKey] = React.useState<{
    name: string;
    key: string;
    maskedKey: string;
  } | null>(null);
  const [revealedWebhookSecret, setRevealedWebhookSecret] = React.useState<{
    id: string;
    url: string;
    secret: string;
  } | null>(null);

  React.useEffect(() => {
    const syncToken = () => {
      setHasToken(Boolean(getStoredAuthToken()));
    };

    syncToken();
    window.addEventListener(AUTH_CHANGED_EVENT, syncToken);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncToken);
    };
  }, []);

  const isAuthenticated = isConnected && Boolean(address) && hasToken;

  const organizationsQuery = useDeveloperOrganizations(isAuthenticated);
  const organizations = React.useMemo(
    () => organizationsQuery.data ?? [],
    [organizationsQuery.data],
  );

  React.useEffect(() => {
    if (!organizations.length) {
      setSelectedOrganizationId(undefined);
      setSelectedProjectId(undefined);
      setSelectedEnvironmentId(undefined);
      return;
    }

    if (
      !selectedOrganizationId ||
      !organizations.some((organization) => organization.id === selectedOrganizationId)
    ) {
      setSelectedOrganizationId(organizations[0].id);
      setSelectedProjectId(undefined);
      setSelectedEnvironmentId(undefined);
      setViewKind("organization");
    }
  }, [organizations, selectedOrganizationId]);

  const selectedOrganization =
    organizations.find((organization) => organization.id === selectedOrganizationId) ?? null;

  const projectsQuery = useDeveloperProjects(selectedOrganizationId, isAuthenticated && Boolean(selectedOrganizationId));
  const projects = React.useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

  React.useEffect(() => {
    if (!selectedProjectId) {
      setSelectedEnvironmentId(undefined);
      return;
    }

    if (!projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(undefined);
      setSelectedEnvironmentId(undefined);
      setViewKind("organization");
    }
  }, [projects, selectedProjectId]);

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;

  const environmentsQuery = useDeveloperProjectEnvironments(
    selectedProjectId,
    isAuthenticated && Boolean(selectedProjectId),
  );
  const environments = React.useMemo(
    () => environmentsQuery.data ?? [],
    [environmentsQuery.data],
  );

  React.useEffect(() => {
    if (!selectedEnvironmentId) {
      return;
    }

    if (!environments.some((environment) => environment.id === selectedEnvironmentId)) {
      setSelectedEnvironmentId(undefined);
      if (selectedProjectId) {
        setViewKind("project");
      }
    }
  }, [environments, selectedEnvironmentId, selectedProjectId]);

  const selectedEnvironment =
    environments.find((environment) => environment.id === selectedEnvironmentId) ?? null;

  const scopeOptions = getScopeOptions({
    organization: selectedOrganization,
    project: selectedProject,
    environment: selectedEnvironment,
  });

  React.useEffect(() => {
    if (!scopeOptions.some((option) => option.kind === viewKind)) {
      setViewKind(scopeOptions[scopeOptions.length - 1]?.kind ?? "organization");
    }
  }, [scopeOptions, viewKind]);

  React.useEffect(() => {
    if (!scopeOptions.some((option) => option.kind === keyScopeKind)) {
      setKeyScopeKind(scopeOptions[scopeOptions.length - 1]?.kind ?? "organization");
    }

    if (!scopeOptions.some((option) => option.kind === webhookScopeKind)) {
      setWebhookScopeKind(scopeOptions[scopeOptions.length - 1]?.kind ?? "organization");
    }
  }, [keyScopeKind, scopeOptions, webhookScopeKind]);

  React.useEffect(() => {
    if (selectedProject) {
      setProjectEditDraft({
        name: selectedProject.name,
        description: selectedProject.description ?? "",
      });
    }
  }, [selectedProject]);

  const viewFilters = toScopeFilters(viewKind, {
    organizationId: selectedOrganizationId,
    projectId: selectedProjectId,
    environmentId: selectedEnvironmentId,
  });

  const membersQuery = useDeveloperOrganizationMembers(
    selectedOrganizationId,
    isAuthenticated && Boolean(selectedOrganizationId),
  );
  const apiKeysQuery = useDeveloperApiKeys(
    viewFilters,
    isAuthenticated && Boolean(selectedOrganizationId),
  );
  const webhooksQuery = useDeveloperWebhooks(
    viewFilters,
    isAuthenticated && Boolean(selectedOrganizationId),
  );
  const deliveriesQuery = useDeveloperWebhookDeliveries(
    {
      ...viewFilters,
      take: 10,
    },
    isAuthenticated && Boolean(selectedOrganizationId),
  );

  const members = membersQuery.data?.members ?? [];
  const apiKeys = apiKeysQuery.data ?? [];
  const webhooks = webhooksQuery.data ?? [];
  const deliveries = deliveriesQuery.data ?? [];

  const createOrganizationMutation = useCreateOrganizationMutation();
  const addMemberMutation = useAddOrganizationMemberMutation();
  const createProjectMutation = useCreateProjectMutation();
  const updateProjectMutation = useUpdateProjectMutation();
  const createEnvironmentMutation = useCreateProjectEnvironmentMutation();
  const createApiKeyMutation = useCreateApiKeyMutation();
  const revokeApiKeyMutation = useRevokeApiKeyMutation();
  const createWebhookMutation = useCreateWebhookMutation();
  const updateWebhookMutation = useUpdateWebhookMutation();
  const archiveWebhookMutation = useArchiveWebhookMutation();
  const replayWebhookMutation = useReplayWebhookMutation();

  const isBootstrapping =
    organizationsQuery.isLoading && isAuthenticated && organizations.length === 0;

  const platformError =
    organizationsQuery.error ??
    projectsQuery.error ??
    membersQuery.error ??
    apiKeysQuery.error ??
    webhooksQuery.error ??
    deliveriesQuery.error ??
    environmentsQuery.error;

  const currentScopeLabel =
    viewKind === "environment" && selectedEnvironment
      ? `${selectedProject?.name ?? "Project"} / ${selectedEnvironment.name}`
      : viewKind === "project" && selectedProject
        ? selectedProject.name
        : selectedOrganization?.name ?? "Organization";

  const handleOrganizationChange = (organizationId: string) => {
    setSelectedOrganizationId(organizationId);
    setSelectedProjectId(undefined);
    setSelectedEnvironmentId(undefined);
    setViewKind("organization");
  };

  const handleProjectChange = (projectId: string | undefined) => {
    setSelectedProjectId(projectId);
    setSelectedEnvironmentId(undefined);
    setViewKind(projectId ? "project" : "organization");
  };

  const handleEnvironmentChange = (environmentId: string | undefined) => {
    setSelectedEnvironmentId(environmentId);
    if (environmentId) {
      setViewKind("environment");
      return;
    }

    setViewKind(selectedProjectId ? "project" : "organization");
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  };

  const handleCreateOrganization = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const organization = await createOrganizationMutation.mutateAsync({
        name: organizationDraft.name.trim(),
        description: organizationDraft.description.trim() || undefined,
      });

      setOrganizationDraft({ name: "", description: "" });
      setSelectedOrganizationId(organization.id);
      setCreateOrgOpen(false);
    } catch {
      return;
    }
  };

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedOrganizationId) {
      toast.error("Choose an organization first");
      return;
    }

    try {
      await addMemberMutation.mutateAsync({
        organizationId: selectedOrganizationId,
        walletAddress: memberDraft.walletAddress.trim(),
        role: memberDraft.role,
      });

      setMemberDraft({
        walletAddress: "",
        role: "DEVELOPER",
      });
      setAddMemberOpen(false);
    } catch {
      return;
    }
  };

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedOrganizationId) {
      toast.error("Choose an organization first");
      return;
    }

    try {
      const project = await createProjectMutation.mutateAsync({
        organizationId: selectedOrganizationId,
        name: projectDraft.name.trim(),
        description: projectDraft.description.trim() || undefined,
      });

      setProjectDraft({ name: "", description: "" });
      setSelectedProjectId(project.id);
      setViewKind("project");
      setCreateProjectOpen(false);
    } catch {
      return;
    }
  };

  const handleUpdateProject = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedProject) {
      toast.error("Choose a project first");
      return;
    }

    try {
      await updateProjectMutation.mutateAsync({
        projectId: selectedProject.id,
        name: projectEditDraft.name.trim(),
        description: projectEditDraft.description.trim() || undefined,
      });

      setEditProjectOpen(false);
    } catch {
      return;
    }
  };

  const handleCreateEnvironment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedProjectId) {
      toast.error("Choose a project first");
      return;
    }

    try {
      const environment = await createEnvironmentMutation.mutateAsync({
        projectId: selectedProjectId,
        name: environmentDraft.name.trim(),
        type: environmentDraft.type,
        baseUrl: environmentDraft.baseUrl.trim() || undefined,
      });

      setEnvironmentDraft({
        name: "",
        type: "SANDBOX",
        baseUrl: "",
      });
      setSelectedEnvironmentId(environment.id);
      setViewKind("environment");
      setCreateEnvironmentOpen(false);
    } catch {
      return;
    }
  };

  const handleCreateApiKey = async (event: React.FormEvent) => {
    event.preventDefault();

    const scope = toScopeFilters(keyScopeKind, {
      organizationId: selectedOrganizationId,
      projectId: selectedProjectId,
      environmentId: selectedEnvironmentId,
    });

    if (!scope.organizationId && !scope.projectId && !scope.environmentId) {
      toast.error("Choose a valid scope for the API key");
      return;
    }

    try {
      const apiKey = await createApiKeyMutation.mutateAsync({
        ...scope,
        name: apiKeyDraft.name.trim(),
        description: apiKeyDraft.description.trim() || undefined,
        scopes: parseCsvList(apiKeyDraft.scopes),
      });

      setGeneratedKey({
        name: apiKey.name,
        key: apiKey.key ?? "",
        maskedKey: apiKey.maskedKey,
      });
      setApiKeyDraft({
        name: "",
        description: "",
        scopes: "",
      });
      setCreateKeyOpen(false);
    } catch {
      return;
    }
  };

  const handleCreateWebhook = async (event: React.FormEvent) => {
    event.preventDefault();

    const scope = toScopeFilters(webhookScopeKind, {
      organizationId: selectedOrganizationId,
      projectId: selectedProjectId,
      environmentId: selectedEnvironmentId,
    });

    if (!scope.organizationId && !scope.projectId && !scope.environmentId) {
      toast.error("Choose a valid scope for the webhook");
      return;
    }

    let headers: Record<string, string> | undefined;

    try {
      headers = parseHeaders(webhookDraft.headers);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      return;
    }

    try {
      const webhook = await createWebhookMutation.mutateAsync({
        ...scope,
        url: webhookDraft.url.trim(),
        events: parseCsvList(webhookDraft.events),
        secret: webhookDraft.secret.trim() || undefined,
        description: webhookDraft.description.trim() || undefined,
        headers,
      });

      if (webhook.secret) {
        setRevealedWebhookSecret({
          id: webhook.id,
          url: webhook.url,
          secret: webhook.secret,
        });
      }

      setWebhookDraft({
        url: "",
        events: "escrow.created",
        secret: "",
        description: "",
        headers: "",
      });
      setCreateWebhookOpen(false);
    } catch {
      return;
    }
  };

  const addEventSuggestion = (eventName: string) => {
    const nextEvents = new Set(parseCsvList(webhookDraft.events));
    nextEvents.add(eventName);
    setWebhookDraft((current) => ({
      ...current,
      events: Array.from(nextEvents).join(", "),
    }));
  };

  if (!isConnected || !address) {
    return (
      <Card className="border-neutral-800 bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-neutral-50">Developer Platform</CardTitle>
          <CardDescription className="text-neutral-400">
            Connect your wallet, then complete SIWE sign-in from the dashboard header to manage organizations, projects, keys, and webhook delivery logs.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!hasToken) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-amber-200">Finish wallet sign-in</CardTitle>
          <CardDescription className="text-amber-100/70">
            Your wallet is connected as <span className="font-mono">{shortenAddress(address)}</span>. Use the connect control in the header to complete authenticated access to the developer platform.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isBootstrapping) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-neutral-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading developer platform...
      </div>
    );
  }

  if (!organizations.length) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden border-neutral-800 bg-neutral-950">
          <div className="border-b border-neutral-800 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_45%),linear-gradient(135deg,rgba(10,10,10,1),rgba(23,23,23,0.95))] p-8">
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              Developer Platform
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50">
              Turn EscrowKit into your integration layer
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
              The backend now supports multi-tenant organizations, projects, sandbox and production environments, scoped API keys, and webhook delivery logs. Create your first organization to unlock the new console.
            </p>
          </div>
          <CardContent className="grid gap-6 p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <form className="space-y-4" onSubmit={handleCreateOrganization}>
              <div className="space-y-2">
                <Label htmlFor="org-name" className="text-neutral-200">
                  Organization name
                </Label>
                <Input
                  id="org-name"
                  value={organizationDraft.name}
                  onChange={(event) =>
                    setOrganizationDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Acme Marketplace"
                  className="border-neutral-800 bg-neutral-950 text-neutral-50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-description" className="text-neutral-200">
                  Description
                </Label>
                <Textarea
                  id="org-description"
                  value={organizationDraft.description}
                  onChange={(event) =>
                    setOrganizationDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="What does this tenant use EscrowKit for?"
                  className="min-h-28 border-neutral-800 bg-neutral-950 text-neutral-50"
                />
              </div>
              <Button
                type="submit"
                className="bg-emerald-500 text-black hover:bg-emerald-400"
                disabled={createOrganizationMutation.isPending || !organizationDraft.name.trim()}
              >
                {createOrganizationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating organization...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create first organization
                  </>
                )}
              </Button>
            </form>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
              <h3 className="text-lg font-semibold text-neutral-50">What you unlock</h3>
              <div className="mt-4 grid gap-3">
                {[
                  "Create tenant-aware projects with sandbox and production environments.",
                  "Mint scoped API keys without reusing legacy user-only credentials.",
                  "Register signed webhooks and inspect replayable delivery history.",
                  "Add teammates with owner, admin, developer, or viewer access.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-black/20 px-4 py-3 text-sm text-neutral-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {platformError && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="flex items-center gap-3 p-4 text-sm text-red-200">
              <TriangleAlert className="h-4 w-4" />
              {(platformError as Error).message}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="rounded-3xl border border-neutral-800 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(180deg,rgba(10,10,10,1),rgba(23,23,23,0.96))] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                Multi-tenant console
              </Badge>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
                  Developer Platform
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                  Manage organizations, projects, scoped credentials, and webhook observability on top of the new backend platform layer.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Organizations"
                value={organizations.length}
                description="Tenants you belong to"
                icon={Building2}
              />
              <StatCard
                label="Projects"
                value={projects.length}
                description="Within the selected organization"
                icon={FolderKanban}
              />
              <StatCard
                label="API Keys"
                value={apiKeys.length}
                description={`Visible at ${currentScopeLabel}`}
                icon={KeyRound}
              />
              <StatCard
                label="Deliveries"
                value={deliveries.length}
                description="Recent webhook activity"
                icon={Activity}
              />
            </div>
          </div>
        </div>

        {platformError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {(platformError as Error).message}
          </div>
        )}
      </div>

      <Card className="border-neutral-800 bg-neutral-900/90">
        <CardHeader className="space-y-5">
          <SectionTitle
            icon={Settings2}
            title="Workspace context"
            description="Choose the tenant slice you want to inspect. Project and environment selectors are optional so you can browse broader organization-level resources when needed."
            action={
              <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-neutral-700 bg-neutral-950 text-neutral-200 hover:bg-neutral-800">
                    <Plus className="h-4 w-4" />
                    Add organization
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-neutral-800 bg-neutral-950 text-neutral-50 sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Create organization</DialogTitle>
                    <DialogDescription>
                      This becomes the top-level tenant for projects, environments, keys, and webhooks.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleCreateOrganization}>
                    <div className="space-y-2">
                      <Label htmlFor="org-dialog-name">Organization name</Label>
                      <Input
                        id="org-dialog-name"
                        value={organizationDraft.name}
                        onChange={(event) =>
                          setOrganizationDraft((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="border-neutral-800 bg-neutral-900 text-neutral-50"
                        placeholder="Acme Marketplace"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-dialog-description">Description</Label>
                      <Textarea
                        id="org-dialog-description"
                        value={organizationDraft.description}
                        onChange={(event) =>
                          setOrganizationDraft((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        className="min-h-24 border-neutral-800 bg-neutral-900 text-neutral-50"
                        placeholder="Internal note about what this tenant powers"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        className="bg-emerald-500 text-black hover:bg-emerald-400"
                        disabled={createOrganizationMutation.isPending || !organizationDraft.name.trim()}
                      >
                        {createOrganizationMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create organization"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            }
          />

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-neutral-300">Organization</Label>
              <Select value={selectedOrganizationId} onValueChange={handleOrganizationChange}>
                <SelectTrigger className="w-full border-neutral-800 bg-neutral-950 text-neutral-50">
                  <SelectValue placeholder="Choose an organization" />
                </SelectTrigger>
                <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-50">
                  {organizations.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300">Project</Label>
              <Select
                value={selectedProjectId ?? EMPTY_SENTINEL}
                onValueChange={(value) =>
                  handleProjectChange(value === EMPTY_SENTINEL ? undefined : value)
                }
              >
                <SelectTrigger className="w-full border-neutral-800 bg-neutral-950 text-neutral-50">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-50">
                  <SelectItem value={EMPTY_SENTINEL}>All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300">Environment</Label>
              <Select
                value={selectedEnvironmentId ?? EMPTY_SENTINEL}
                onValueChange={(value) =>
                  handleEnvironmentChange(value === EMPTY_SENTINEL ? undefined : value)
                }
                disabled={!selectedProjectId}
              >
                <SelectTrigger className="w-full border-neutral-800 bg-neutral-950 text-neutral-50">
                  <SelectValue placeholder="All environments" />
                </SelectTrigger>
                <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-50">
                  <SelectItem value={EMPTY_SENTINEL}>All environments</SelectItem>
                  {environments.map((environment) => (
                    <SelectItem key={environment.id} value={environment.id}>
                      {environment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300">View scope</Label>
              <Select value={viewKind} onValueChange={(value) => setViewKind(value as ScopeKind)}>
                <SelectTrigger className="w-full border-neutral-800 bg-neutral-950 text-neutral-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-50">
                  {scopeOptions.map((option) => (
                    <SelectItem key={option.kind} value={option.kind}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Organization</p>
                  <p className="mt-2 text-lg font-semibold text-neutral-50">
                    {selectedOrganization?.name ?? "Select an organization"}
                  </p>
                </div>
                <Badge className={roleTone(selectedOrganization?.role)}>
                  {selectedOrganization?.role ?? "VIEWER"}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-neutral-400">
                {selectedOrganization?.description || "Use organization scope for shared credentials and top-level tenant access."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-500">
                <span>{selectedOrganization?.counts?.projects ?? 0} projects</span>
                <span>•</span>
                <span>{selectedOrganization?.counts?.apiKeys ?? 0} keys</span>
                <span>•</span>
                <span>{selectedOrganization?.counts?.webhooks ?? 0} webhooks</span>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Project</p>
                  <p className="mt-2 text-lg font-semibold text-neutral-50">
                    {selectedProject?.name ?? "All projects"}
                  </p>
                </div>
                {selectedProject?.role && (
                  <Badge className={roleTone(selectedProject.role)}>{selectedProject.role}</Badge>
                )}
              </div>
              <p className="mt-3 text-sm text-neutral-400">
                {selectedProject?.description || "Narrow to a project when you want environment-aware integrations and project-local metrics."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-500">
                <span>{selectedProject?.counts?.environments ?? 0} environments</span>
                <span>•</span>
                <span>{selectedProject?.counts?.escrows ?? 0} escrows</span>
                <span>•</span>
                <span>{selectedProject?.counts?.webhooks ?? 0} webhooks</span>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Environment</p>
                  <p className="mt-2 text-lg font-semibold text-neutral-50">
                    {selectedEnvironment?.name ?? "All environments"}
                  </p>
                </div>
                {selectedEnvironment?.type && (
                  <Badge className={environmentTone(selectedEnvironment.type)}>
                    {selectedEnvironment.type}
                  </Badge>
                )}
              </div>
              <p className="mt-3 text-sm text-neutral-400">
                {selectedEnvironment?.baseUrl || "Use environment scope for the most restrictive API keys and deployment-specific webhook endpoints."}
              </p>
              <div className="mt-4 text-xs text-neutral-500">
                Current filter: <span className="text-neutral-300">{currentScopeLabel}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-neutral-800 bg-neutral-900/90">
          <CardHeader className="space-y-4">
            <SectionTitle
              icon={FolderKanban}
              title="Projects and environments"
              description="The new backend auto-creates sandbox and production environments per project. Use this surface to keep the frontend aligned with that tenant model."
              action={
                <div className="flex flex-wrap gap-2">
                  <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-500 text-black hover:bg-emerald-400">
                        <Plus className="h-4 w-4" />
                        New project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-neutral-800 bg-neutral-950 text-neutral-50 sm:max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Create project</DialogTitle>
                        <DialogDescription>
                          A project automatically gets sandbox and production environments.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4" onSubmit={handleCreateProject}>
                        <div className="space-y-2">
                          <Label htmlFor="project-name">Project name</Label>
                          <Input
                            id="project-name"
                            value={projectDraft.name}
                            onChange={(event) =>
                              setProjectDraft((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            className="border-neutral-800 bg-neutral-900 text-neutral-50"
                            placeholder="Checkout SDK"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-description">Description</Label>
                          <Textarea
                            id="project-description"
                            value={projectDraft.description}
                            onChange={(event) =>
                              setProjectDraft((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            className="min-h-24 border-neutral-800 bg-neutral-900 text-neutral-50"
                            placeholder="What part of your platform does this project support?"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            className="bg-emerald-500 text-black hover:bg-emerald-400"
                            disabled={
                              createProjectMutation.isPending ||
                              !selectedOrganizationId ||
                              !projectDraft.name.trim()
                            }
                          >
                            {createProjectMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create project"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={createEnvironmentOpen} onOpenChange={setCreateEnvironmentOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-neutral-700 bg-neutral-950 text-neutral-200 hover:bg-neutral-800"
                        disabled={!selectedProjectId}
                      >
                        <Globe className="h-4 w-4" />
                        Add environment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-neutral-800 bg-neutral-950 text-neutral-50 sm:max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Create environment</DialogTitle>
                        <DialogDescription>
                          Add another deploy target when sandbox and production are not enough.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4" onSubmit={handleCreateEnvironment}>
                        <div className="space-y-2">
                          <Label htmlFor="environment-name">Environment name</Label>
                          <Input
                            id="environment-name"
                            value={environmentDraft.name}
                            onChange={(event) =>
                              setEnvironmentDraft((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            className="border-neutral-800 bg-neutral-900 text-neutral-50"
                            placeholder="QA Mirror"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-300">Environment type</Label>
                          <Select
                            value={environmentDraft.type}
                            onValueChange={(value) =>
                              setEnvironmentDraft((current) => ({
                                ...current,
                                type: value as "SANDBOX" | "PRODUCTION",
                              }))
                            }
                          >
                            <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-neutral-50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-50">
                              <SelectItem value="SANDBOX">SANDBOX</SelectItem>
                              <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="environment-base-url">Base URL</Label>
                          <Input
                            id="environment-base-url"
                            value={environmentDraft.baseUrl}
                            onChange={(event) =>
                              setEnvironmentDraft((current) => ({
                                ...current,
                                baseUrl: event.target.value,
                              }))
                            }
                            className="border-neutral-800 bg-neutral-900 text-neutral-50"
                            placeholder="https://sandbox.example.com"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            className="bg-emerald-500 text-black hover:bg-emerald-400"
                            disabled={
                              createEnvironmentMutation.isPending ||
                              !selectedProjectId ||
                              !environmentDraft.name.trim()
                            }
                          >
                            {createEnvironmentMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create environment"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-neutral-700 bg-neutral-950 text-neutral-200 hover:bg-neutral-800"
                        disabled={!selectedProject}
                      >
                        <Settings2 className="h-4 w-4" />
                        Edit project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-neutral-800 bg-neutral-950 text-neutral-50 sm:max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Edit project</DialogTitle>
                        <DialogDescription>
                          Update the current project metadata without touching on-chain escrows.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4" onSubmit={handleUpdateProject}>
                        <div className="space-y-2">
                          <Label htmlFor="project-edit-name">Project name</Label>
                          <Input
                            id="project-edit-name"
                            value={projectEditDraft.name}
                            onChange={(event) =>
                              setProjectEditDraft((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            className="border-neutral-800 bg-neutral-900 text-neutral-50"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-edit-description">Description</Label>
                          <Textarea
                            id="project-edit-description"
                            value={projectEditDraft.description}
                            onChange={(event) =>
                              setProjectEditDraft((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            className="min-h-24 border-neutral-800 bg-neutral-900 text-neutral-50"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            className="bg-emerald-500 text-black hover:bg-emerald-400"
                            disabled={
                              updateProjectMutation.isPending ||
                              !selectedProject ||
                              !projectEditDraft.name.trim()
                            }
                          >
                            {updateProjectMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save project"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              }
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6 text-sm text-neutral-400">
                  No projects yet for this organization.
                </div>
              ) : (
                projects.map((project) => {
                  const isActive = project.id === selectedProjectId;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                        isActive
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                      }`}
                      onClick={() => handleProjectChange(project.id)}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold text-neutral-50">{project.name}</p>
                            <Badge className={roleTone(project.role)}>{project.role ?? "VIEWER"}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-neutral-400">
                            {project.description || "No project description yet."}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500 sm:text-right">
                          <span>{project.counts?.environments ?? 0} envs</span>
                          <span>{project.counts?.apiKeys ?? 0} keys</span>
                          <span>{project.counts?.webhooks ?? 0} webhooks</span>
                          <span>{project.counts?.escrows ?? 0} escrows</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <Separator className="bg-neutral-800" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Environments
                </h3>
                {environmentsQuery.isFetching && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Refreshing
                  </div>
                )}
              </div>
              {!selectedProjectId ? (
                <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6 text-sm text-neutral-400">
                  Pick a project to browse its environments.
                </div>
              ) : environments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6 text-sm text-neutral-400">
                  No environments created for this project.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {environments.map((environment) => {
                    const isActive = environment.id === selectedEnvironmentId;
                    return (
                      <button
                        key={environment.id}
                        type="button"
                        className={`rounded-2xl border px-5 py-4 text-left transition ${
                          isActive
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                        }`}
                        onClick={() => handleEnvironmentChange(environment.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-neutral-50">{environment.name}</p>
                            <p className="mt-1 text-xs text-neutral-500">{environment.slug}</p>
                          </div>
                          <Badge className={environmentTone(environment.type)}>
                            {environment.type}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-neutral-400">
                          {environment.baseUrl || "No base URL configured yet."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/90">
          <CardHeader className="space-y-4">
            <SectionTitle
              icon={Users}
              title="Organization members"
              description="Roles come from the new backend membership model. Owners and admins can invite teammates directly by wallet address."
              action={
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-neutral-700 bg-neutral-950 text-neutral-200 hover:bg-neutral-800"
                      disabled={!selectedOrganizationId}
                    >
                      <Plus className="h-4 w-4" />
                      Add member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-neutral-800 bg-neutral-950 text-neutral-50 sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Add organization member</DialogTitle>
                      <DialogDescription>
                        The backend will upsert the member and create a user record if one does not already exist.
                      </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleAddMember}>
                      <div className="space-y-2">
                        <Label htmlFor="member-wallet">Wallet address</Label>
                        <Input
                          id="member-wallet"
                          value={memberDraft.walletAddress}
                          onChange={(event) =>
                            setMemberDraft((current) => ({
                              ...current,
                              walletAddress: event.target.value,
                            }))
                          }
                          className="border-neutral-800 bg-neutral-900 text-neutral-50 font-mono"
                          placeholder="0x..."
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-300">Role</Label>
                        <Select
                          value={memberDraft.role}
                          onValueChange={(value) =>
                            setMemberDraft((current) => ({
                              ...current,
                              role: value,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-neutral-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-50">
                            {["OWNER", "ADMIN", "DEVELOPER", "VIEWER"].map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          className="bg-emerald-500 text-black hover:bg-emerald-400"
                          disabled={
                            addMemberMutation.isPending ||
                            !selectedOrganizationId ||
                            !memberDraft.walletAddress.trim()
                          }
                        >
                          {addMemberMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Invite member"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              }
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6 text-sm text-neutral-400">
                No members returned for this organization yet.
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-50">
                        {member.user.username || shortenAddress(member.user.address)}
                      </p>
                      <p className="mt-1 font-mono text-xs text-neutral-500">
                        {member.user.address}
                      </p>
                    </div>
                    <Badge className={roleTone(member.role)}>{member.role}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                    <span>{member.user.email || "No email set"}</span>
                    <span>Joined {formatDate(member.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-neutral-800 bg-neutral-900/90">
          <CardHeader className="space-y-4">
            <SectionTitle
              icon={KeyRound}
              title="API keys"
              description="Legacy user-level key management has been replaced here with organization, project, and environment scoped credentials."
              action={
                <Dialog open={createKeyOpen} onOpenChange={setCreateKeyOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-500 text-black hover:bg-emerald-400">
                      <Plus className="h-4 w-4" />
                      Create API key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-neutral-800 bg-neutral-950 text-neutral-50 sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Create scoped API key</DialogTitle>
                      <DialogDescription>
                        The backend requires exactly one scope: organization, project, or environment.
                      </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleCreateApiKey}>
                      <div className="space-y-2">
                        <Label className="text-neutral-300">Scope</Label>
                        <Select
                          value={keyScopeKind}
                          onValueChange={(value) => setKeyScopeKind(value as ScopeKind)}
                        >
                          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-neutral-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-50">
                            {scopeOptions.map((option) => (
                              <SelectItem key={option.kind} value={option.kind}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-neutral-500">
                          {scopeOptions.find((option) => option.kind === keyScopeKind)?.description}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api-key-name">Key name</Label>
                        <Input
                          id="api-key-name"
                          value={apiKeyDraft.name}
                          onChange={(event) =>
                            setApiKeyDraft((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          className="border-neutral-800 bg-neutral-900 text-neutral-50"
                          placeholder="SDK sandbox automation"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api-key-description">Description</Label>
                        <Input
                          id="api-key-description"
                          value={apiKeyDraft.description}
                          onChange={(event) =>
                            setApiKeyDraft((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          className="border-neutral-800 bg-neutral-900 text-neutral-50"
                          placeholder="Optional note"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api-key-scopes">Permission scopes</Label>
                        <Input
                          id="api-key-scopes"
                          value={apiKeyDraft.scopes}
                          onChange={(event) =>
                            setApiKeyDraft((current) => ({
                              ...current,
                              scopes: event.target.value,
                            }))
                          }
                          className="border-neutral-800 bg-neutral-900 text-neutral-50"
                          placeholder="escrows.read, escrows.write"
                        />
                        <p className="text-xs text-neutral-500">
                          Optional comma-separated scopes stored with the key for downstream policy checks.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          className="bg-emerald-500 text-black hover:bg-emerald-400"
                          disabled={
                            createApiKeyMutation.isPending || !apiKeyDraft.name.trim()
                          }
                        >
                          {createApiKeyMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create key"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              }
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedKey && generatedKey.key && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">
                      {generatedKey.name} created
                    </p>
                    <p className="mt-1 text-xs text-emerald-100/70">
                      This secret is only shown once. Store it now.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-emerald-500/20 bg-transparent text-emerald-200 hover:bg-emerald-500/10"
                    onClick={() => handleCopy(generatedKey.key, "API key")}
                  >
                    <Copy className="h-4 w-4" />
                    Copy key
                  </Button>
                </div>
                <div className="mt-3 rounded-xl border border-emerald-500/10 bg-black/30 px-3 py-2 font-mono text-sm text-neutral-100 break-all">
                  {generatedKey.key}
                </div>
              </div>
            )}

            {apiKeys.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6 text-sm text-neutral-400">
                No API keys at the current scope.
              </div>
            ) : (
              apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-neutral-50">{apiKey.name}</p>
                        <Badge className={apiKey.isActive ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-neutral-800 text-neutral-300 border-neutral-700"}>
                          {apiKey.isActive ? "ACTIVE" : "REVOKED"}
                        </Badge>
                      </div>
                      <p className="font-mono text-xs text-neutral-400">{apiKey.maskedKey}</p>
                      <p className="text-xs text-neutral-500">
                        Scope: {formatScopeLabel(apiKey)}
                      </p>
                      {apiKey.scopes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {apiKey.scopes.map((scope) => (
                            <Badge
                              key={scope}
                              className="border-neutral-700 bg-neutral-800 text-neutral-300"
                            >
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <Button
                        variant="outline"
                        className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-800"
                        onClick={() => revokeApiKeyMutation.mutate({ keyId: apiKey.id })}
                        disabled={!apiKey.isActive || revokeApiKeyMutation.isPending}
                      >
                        {revokeApiKeyMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PauseCircle className="h-4 w-4" />
                        )}
                        Revoke
                      </Button>
                      <p className="text-xs text-neutral-500">
                        Created {formatDate(apiKey.createdAt)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Last used {formatDateTime(apiKey.lastUsedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/90">
          <CardHeader className="space-y-4">
            <SectionTitle
              icon={Webhook}
              title="Webhooks"
              description="Register signed endpoints, pause or resume them, and replay recent deliveries without dropping into the backend."
              action={
                <Dialog open={createWebhookOpen} onOpenChange={setCreateWebhookOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-500 text-black hover:bg-emerald-400">
                      <Plus className="h-4 w-4" />
                      Add webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-neutral-800 bg-neutral-950 text-neutral-50 sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Create webhook</DialogTitle>
                      <DialogDescription>
                        Create a signed endpoint bound to the current tenant scope.
                      </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleCreateWebhook}>
                      <div className="space-y-2">
                        <Label className="text-neutral-300">Scope</Label>
                        <Select
                          value={webhookScopeKind}
                          onValueChange={(value) =>
                            setWebhookScopeKind(value as ScopeKind)
                          }
                        >
                          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-neutral-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-50">
                            {scopeOptions.map((option) => (
                              <SelectItem key={option.kind} value={option.kind}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-neutral-500">
                          {scopeOptions.find((option) => option.kind === webhookScopeKind)?.description}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-url">Webhook URL</Label>
                        <Input
                          id="webhook-url"
                          value={webhookDraft.url}
                          onChange={(event) =>
                            setWebhookDraft((current) => ({
                              ...current,
                              url: event.target.value,
                            }))
                          }
                          className="border-neutral-800 bg-neutral-900 text-neutral-50"
                          placeholder="https://example.com/webhooks/escrowkit"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-events">Events</Label>
                        <Input
                          id="webhook-events"
                          value={webhookDraft.events}
                          onChange={(event) =>
                            setWebhookDraft((current) => ({
                              ...current,
                              events: event.target.value,
                            }))
                          }
                          className="border-neutral-800 bg-neutral-900 text-neutral-50"
                          placeholder="escrow.created, milestone.approved"
                          required
                        />
                        <div className="flex flex-wrap gap-2">
                          {DEFAULT_WEBHOOK_EVENT_SUGGESTIONS.map((eventName) => (
                            <button
                              key={eventName}
                              type="button"
                              className="rounded-full border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-800"
                              onClick={() => addEventSuggestion(eventName)}
                            >
                              {eventName}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-secret">Secret override</Label>
                        <Input
                          id="webhook-secret"
                          value={webhookDraft.secret}
                          onChange={(event) =>
                            setWebhookDraft((current) => ({
                              ...current,
                              secret: event.target.value,
                            }))
                          }
                          className="border-neutral-800 bg-neutral-900 text-neutral-50"
                          placeholder="Leave blank to auto-generate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-description">Description</Label>
                        <Input
                          id="webhook-description"
                          value={webhookDraft.description}
                          onChange={(event) =>
                            setWebhookDraft((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          className="border-neutral-800 bg-neutral-900 text-neutral-50"
                          placeholder="Where this endpoint is consumed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-headers">Custom headers JSON</Label>
                        <Textarea
                          id="webhook-headers"
                          value={webhookDraft.headers}
                          onChange={(event) =>
                            setWebhookDraft((current) => ({
                              ...current,
                              headers: event.target.value,
                            }))
                          }
                          className="min-h-24 border-neutral-800 bg-neutral-900 text-neutral-50 font-mono text-sm"
                          placeholder='{"x-partner-id":"acme"}'
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          className="bg-emerald-500 text-black hover:bg-emerald-400"
                          disabled={
                            createWebhookMutation.isPending ||
                            !webhookDraft.url.trim() ||
                            parseCsvList(webhookDraft.events).length === 0
                          }
                        >
                          {createWebhookMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create webhook"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              }
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {revealedWebhookSecret?.secret && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">
                      Webhook secret for {revealedWebhookSecret.url}
                    </p>
                    <p className="mt-1 text-xs text-emerald-100/70">
                      Copy this now. The backend only returns the full secret at creation or explicit rotation time.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-emerald-500/20 bg-transparent text-emerald-200 hover:bg-emerald-500/10"
                    onClick={() =>
                      handleCopy(revealedWebhookSecret.secret, "Webhook secret")
                    }
                  >
                    <Copy className="h-4 w-4" />
                    Copy secret
                  </Button>
                </div>
                <div className="mt-3 rounded-xl border border-emerald-500/10 bg-black/30 px-3 py-2 font-mono text-sm text-neutral-100 break-all">
                  {revealedWebhookSecret.secret}
                </div>
              </div>
            )}

            {webhooks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6 text-sm text-neutral-400">
                No webhooks at the current scope.
              </div>
            ) : (
              webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-neutral-50">{webhook.description || webhook.url}</p>
                        <Badge className={webhook.isActive ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-neutral-800 text-neutral-300 border-neutral-700"}>
                          {webhook.isActive ? "ACTIVE" : "PAUSED"}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-400 break-all">{webhook.url}</p>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((eventName) => (
                          <Badge
                            key={`${webhook.id}-${eventName}`}
                            className="border-neutral-700 bg-neutral-800 text-neutral-300"
                          >
                            {eventName}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Scope: {formatScopeLabel(webhook)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:max-w-[280px] lg:justify-end">
                      <Button
                        variant="outline"
                        className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-800"
                        onClick={() =>
                          updateWebhookMutation.mutate({
                            webhookId: webhook.id,
                            isActive: !webhook.isActive,
                          })
                        }
                        disabled={updateWebhookMutation.isPending}
                      >
                        {webhook.isActive ? (
                          <>
                            <PauseCircle className="h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4" />
                            Resume
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-800"
                        onClick={() => replayWebhookMutation.mutate({ webhookId: webhook.id })}
                        disabled={replayWebhookMutation.isPending}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Replay latest
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-500/20 bg-transparent text-red-200 hover:bg-red-500/10"
                        onClick={() => archiveWebhookMutation.mutate({ webhookId: webhook.id })}
                        disabled={archiveWebhookMutation.isPending}
                      >
                        <PauseCircle className="h-4 w-4" />
                        Archive
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
                    <span>{webhook.deliveryCount ?? 0} deliveries</span>
                    <span>•</span>
                    <span>Secret ending {webhook.secretLastFour || "n/a"}</span>
                    <span>•</span>
                    <span>Last triggered {formatDateTime(webhook.lastTriggeredAt)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-neutral-800 bg-neutral-900/90">
        <CardHeader className="space-y-4">
          <SectionTitle
            icon={Activity}
            title="Webhook delivery log"
            description="Recent delivery status is now persisted in the backend. Failures can be replayed from here or from the webhook card above."
            action={
              <Badge className="border-neutral-700 bg-neutral-950 text-neutral-300">
                Current scope: {viewKind.toUpperCase()}
              </Badge>
            }
          />
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6 text-sm text-neutral-400">
              No deliveries recorded yet for this scope.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-neutral-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800 hover:bg-transparent">
                    <TableHead className="text-neutral-400">Event</TableHead>
                    <TableHead className="text-neutral-400">Webhook</TableHead>
                    <TableHead className="text-neutral-400">Status</TableHead>
                    <TableHead className="text-neutral-400">Response</TableHead>
                    <TableHead className="text-neutral-400">Delivered</TableHead>
                    <TableHead className="text-right text-neutral-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id} className="border-neutral-800">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-neutral-50">{delivery.event}</p>
                          <p className="font-mono text-xs text-neutral-500">
                            {delivery.requestId || delivery.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="max-w-[260px] truncate text-sm text-neutral-300">
                            {delivery.webhook.description || delivery.webhook.url}
                          </p>
                          <p className="max-w-[260px] truncate text-xs text-neutral-500">
                            {delivery.webhook.url}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={deliveryTone(delivery.status)}>{delivery.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-300">
                        {delivery.responseStatus ?? "n/a"}
                        {delivery.errorMessage && (
                          <p className="mt-1 max-w-[220px] truncate text-xs text-red-300">
                            {delivery.errorMessage}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-400">
                        {formatDateTime(delivery.deliveredAt || delivery.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-800"
                          onClick={() =>
                            replayWebhookMutation.mutate({
                              webhookId: delivery.webhook.id,
                              deliveryId: delivery.id,
                            })
                          }
                          disabled={replayWebhookMutation.isPending}
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Replay
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-neutral-800 bg-neutral-950/80">
        <CardContent className="grid gap-4 p-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-medium text-neutral-50">Legacy mismatch resolved</p>
                <p className="text-sm text-neutral-400">
                  Developer settings now use `/api/v1` multi-tenant endpoints instead of the old `/users/:address/keys` flow.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-sky-400" />
              <div>
                <p className="font-medium text-neutral-50">Project-first setup</p>
                <p className="text-sm text-neutral-400">
                  Sandbox and production environments are surfaced directly from the backend project model.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-amber-400" />
              <div>
                <p className="font-medium text-neutral-50">Replayable observability</p>
                <p className="text-sm text-neutral-400">
                  Delivery history and replay controls are now visible without leaving the dashboard.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
