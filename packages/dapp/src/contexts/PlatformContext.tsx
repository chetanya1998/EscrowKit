"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { getStoredAuthToken, AUTH_CHANGED_EVENT } from "@/lib/utils";
import {
  useDeveloperOrganizations,
  useDeveloperProjects,
  useDeveloperProjectEnvironments,
} from "@/hooks/useDeveloperPlatform";
import type { Organization, Project, ProjectEnvironment } from "@/lib/developer-platform";

interface PlatformContextType {
  isAuthenticated: boolean;
  hasToken: boolean;
  
  organizations: Organization[];
  projects: Project[];
  environments: ProjectEnvironment[];
  
  selectedOrganizationId: string | undefined;
  selectedProjectId: string | undefined;
  selectedEnvironmentId: string | undefined;
  
  activeOrganization: Organization | null;
  activeProject: Project | null;
  activeEnvironment: ProjectEnvironment | null;
  
  setSelectedOrganizationId: (id: string | undefined) => void;
  setSelectedProjectId: (id: string | undefined) => void;
  setSelectedEnvironmentId: (id: string | undefined) => void;
  
  isBootstrapping: boolean;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const [hasToken, setHasToken] = useState(false);

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>();
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>();

  useEffect(() => {
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
  const organizations = useMemo(
    () => organizationsQuery.data ?? [],
    [organizationsQuery.data]
  );

  // Auto-select first org if available and none selected
  useEffect(() => {
    if (!organizations.length) {
      if (selectedOrganizationId) setSelectedOrganizationId(undefined);
      return;
    }
    if (!selectedOrganizationId || !organizations.some((o) => o.id === selectedOrganizationId)) {
      setSelectedOrganizationId(organizations[0].id);
    }
  }, [organizations, selectedOrganizationId]);

  const activeOrganization =
    organizations.find((o) => o.id === selectedOrganizationId) ?? null;

  const projectsQuery = useDeveloperProjects(
    selectedOrganizationId,
    isAuthenticated && Boolean(selectedOrganizationId)
  );
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

  useEffect(() => {
    if (!selectedProjectId) return;
    if (!projects.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(undefined);
    }
  }, [projects, selectedProjectId]);

  const activeProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  const environmentsQuery = useDeveloperProjectEnvironments(
    selectedProjectId,
    isAuthenticated && Boolean(selectedProjectId)
  );
  const environments = useMemo(() => environmentsQuery.data ?? [], [environmentsQuery.data]);

  useEffect(() => {
    if (!selectedEnvironmentId) return;
    if (!environments.some((e) => e.id === selectedEnvironmentId)) {
      setSelectedEnvironmentId(undefined);
    }
  }, [environments, selectedEnvironmentId]);

  const activeEnvironment =
    environments.find((e) => e.id === selectedEnvironmentId) ?? null;

  const isBootstrapping =
    organizationsQuery.isLoading && isAuthenticated && organizations.length === 0;

  const handleSetSelectedOrganizationId = (id: string | undefined) => {
    setSelectedOrganizationId(id);
    setSelectedProjectId(undefined);
    setSelectedEnvironmentId(undefined);
  };

  const handleSetSelectedProjectId = (id: string | undefined) => {
    setSelectedProjectId(id);
    setSelectedEnvironmentId(undefined);
  };

  const value = {
    isAuthenticated,
    hasToken,
    organizations,
    projects,
    environments,
    selectedOrganizationId,
    selectedProjectId,
    selectedEnvironmentId,
    activeOrganization,
    activeProject,
    activeEnvironment,
    setSelectedOrganizationId: handleSetSelectedOrganizationId,
    setSelectedProjectId: handleSetSelectedProjectId,
    setSelectedEnvironmentId,
    isBootstrapping,
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
}
