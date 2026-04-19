import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  AuditActorType,
  MembershipRole,
  Prisma,
  ProjectEnvironmentType,
} from '../generated/prisma/index';
import { hashApiKey, maskApiKey } from '../common/utils/api-key';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import {
  AddOrganizationMemberDto,
  CreateApiKeyDto,
  CreateOrganizationDto,
  CreateProjectDto,
  CreateProjectEnvironmentDto,
  CreateWebhookDto,
  ReplayWebhookDto,
  UpdateProjectDto,
  UpdateWebhookDto,
} from './developer-platform.dto';

type AuditClient = Prisma.TransactionClient | PrismaService;

type TenantScope = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: MembershipRole;
  projectId?: string;
  projectName?: string;
  projectSlug?: string;
  environmentId?: string;
  environmentName?: string;
  environmentSlug?: string;
  environmentType?: ProjectEnvironmentType;
};

@Injectable()
export class DeveloperPlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
  ) {}

  async listOrganizations(walletAddress: string) {
    const user = await this.ensureUserForWallet(walletAddress);
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { userId: user.id },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                apiKeys: true,
                memberships: true,
                projects: true,
                webhooks: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((membership) =>
      this.serializeOrganization(membership.organization, membership.role),
    );
  }

  async createOrganization(
    walletAddress: string,
    dto: CreateOrganizationDto,
  ) {
    const user = await this.ensureUserForWallet(walletAddress);
    const slug = await this.generateUniqueOrganizationSlug(dto.slug ?? dto.name);

    const organization = await this.prisma.$transaction(async (tx) => {
      const createdOrganization = await tx.organization.create({
        data: {
          slug,
          name: dto.name.trim(),
          description: dto.description?.trim(),
          metadata: this.toJsonInput(dto.metadata),
          createdByUserId: user.id,
        },
        include: {
          _count: {
            select: {
              apiKeys: true,
              memberships: true,
              projects: true,
              webhooks: true,
            },
          },
        },
      });

      await tx.organizationMembership.create({
        data: {
          organizationId: createdOrganization.id,
          userId: user.id,
          role: MembershipRole.OWNER,
        },
      });

      await this.writeAuditLog(tx, {
        action: 'organization.created',
        actorUserId: user.id,
        organizationId: createdOrganization.id,
        summary: `Created organization ${createdOrganization.name}`,
        targetId: createdOrganization.id,
        targetType: 'organization',
      });

      return createdOrganization;
    });

    return this.serializeOrganization(organization, MembershipRole.OWNER);
  }

  async getOrganizationMembers(walletAddress: string, organizationId: string) {
    const user = await this.ensureUserForWallet(walletAddress);
    const membership = await this.getOrganizationMembership(organizationId, user.id);

    const memberships = await this.prisma.organizationMembership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            address: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      organization: this.serializeOrganization(
        membership.organization,
        membership.role,
      ),
      members: memberships.map((entry) => ({
        id: entry.id,
        role: entry.role,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        user: entry.user,
      })),
    };
  }

  async addOrganizationMember(
    walletAddress: string,
    organizationId: string,
    dto: AddOrganizationMemberDto,
  ) {
    const user = await this.ensureUserForWallet(walletAddress);
    const membership = await this.getOrganizationMembership(organizationId, user.id);
    this.assertOrganizationAdminRole(membership.role);

    const invitedUser = await this.ensureUserForWallet(dto.walletAddress);
    const role = dto.role ?? MembershipRole.DEVELOPER;

    const savedMembership = await this.prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId,
          userId: invitedUser.id,
        },
      },
      update: { role },
      create: {
        organizationId,
        userId: invitedUser.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            address: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    await this.writeAuditLog(this.prisma, {
      action: 'organization.member.upserted',
      actorUserId: user.id,
      organizationId,
      metadata: {
        invitedUserId: invitedUser.id,
        invitedWalletAddress: invitedUser.address,
        role,
      },
      summary: `Added ${invitedUser.address} to ${membership.organization.name}`,
      targetId: savedMembership.id,
      targetType: 'organization_membership',
    });

    return {
      id: savedMembership.id,
      role: savedMembership.role,
      createdAt: savedMembership.createdAt,
      updatedAt: savedMembership.updatedAt,
      user: savedMembership.user,
    };
  }

  async listProjects(walletAddress: string, organizationId?: string) {
    const user = await this.ensureUserForWallet(walletAddress);

    if (organizationId) {
      await this.getOrganizationMembership(organizationId, user.id);
    }

    const projects = await this.prisma.project.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        organization: {
          memberships: {
            some: { userId: user.id },
          },
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            memberships: {
              where: { userId: user.id },
              select: { role: true },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            apiKeys: true,
            environments: true,
            escrows: true,
            webhooks: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return projects.map((project) =>
      this.serializeProject(project, project.organization.memberships[0]?.role),
    );
  }

  async createProject(walletAddress: string, dto: CreateProjectDto) {
    const user = await this.ensureUserForWallet(walletAddress);
    const membership = await this.getOrganizationMembership(
      dto.organizationId,
      user.id,
    );
    this.assertOrganizationAdminRole(membership.role);

    const slug = await this.generateUniqueProjectSlug(
      dto.organizationId,
      dto.slug ?? dto.name,
    );

    const project = await this.prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          organizationId: dto.organizationId,
          slug,
          name: dto.name.trim(),
          description: dto.description?.trim(),
          metadata: this.toJsonInput(dto.metadata),
          createdByUserId: user.id,
        },
      });

      await Promise.all(
        [
          {
            name: 'Sandbox',
            slug: 'sandbox',
            type: ProjectEnvironmentType.SANDBOX,
          },
          {
            name: 'Production',
            slug: 'production',
            type: ProjectEnvironmentType.PRODUCTION,
          },
        ].map((environment) =>
          tx.projectEnvironment.create({
            data: {
              projectId: createdProject.id,
              name: environment.name,
              slug: environment.slug,
              type: environment.type,
              createdByUserId: user.id,
            },
          }),
        ),
      );

      await this.writeAuditLog(tx, {
        action: 'project.created',
        actorUserId: user.id,
        organizationId: dto.organizationId,
        projectId: createdProject.id,
        summary: `Created project ${createdProject.name}`,
        targetId: createdProject.id,
        targetType: 'project',
      });

      return tx.project.findUniqueOrThrow({
        where: { id: createdProject.id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              memberships: {
                where: { userId: user.id },
                select: { role: true },
                take: 1,
              },
            },
          },
          environments: {
            orderBy: [{ createdAt: 'asc' }],
          },
          _count: {
            select: {
              apiKeys: true,
              environments: true,
              escrows: true,
              webhooks: true,
            },
          },
        },
      });
    });

    return this.serializeProject(project, membership.role);
  }

  async getProject(walletAddress: string, projectId: string) {
    const user = await this.ensureUserForWallet(walletAddress);
    const access = await this.getProjectAccess(projectId, user.id);
    return this.serializeProject(access.project, access.role);
  }

  async updateProject(
    walletAddress: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    const user = await this.ensureUserForWallet(walletAddress);
    const access = await this.getProjectAccess(projectId, user.id);
    this.assertOrganizationAdminRole(access.role);

    const nextSlug = dto.slug
      ? await this.generateUniqueProjectSlug(
          access.project.organizationId,
          dto.slug,
          access.project.id,
        )
      : undefined;

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ?? null }
          : {}),
        ...(nextSlug ? { slug: nextSlug } : {}),
        ...(dto.metadata !== undefined
          ? { metadata: this.toJsonInput(dto.metadata) }
          : {}),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            memberships: {
              where: { userId: user.id },
              select: { role: true },
              take: 1,
            },
          },
        },
        environments: {
          orderBy: [{ createdAt: 'asc' }],
        },
        _count: {
          select: {
            apiKeys: true,
            environments: true,
            escrows: true,
            webhooks: true,
          },
        },
      },
    });

    await this.writeAuditLog(this.prisma, {
      action: 'project.updated',
      actorUserId: user.id,
      organizationId: access.project.organizationId,
      projectId,
      metadata: {
        changedFields: Object.keys(dto),
      },
      summary: `Updated project ${updatedProject.name}`,
      targetId: updatedProject.id,
      targetType: 'project',
    });

    return this.serializeProject(updatedProject, access.role);
  }

  async listProjectEnvironments(walletAddress: string, projectId: string) {
    const user = await this.ensureUserForWallet(walletAddress);
    const access = await this.getProjectAccess(projectId, user.id);

    return access.project.environments.map((environment) =>
      this.serializeEnvironment(environment, access.project, access.role),
    );
  }

  async createProjectEnvironment(
    walletAddress: string,
    projectId: string,
    dto: CreateProjectEnvironmentDto,
  ) {
    const user = await this.ensureUserForWallet(walletAddress);
    const access = await this.getProjectAccess(projectId, user.id);
    this.assertOrganizationAdminRole(access.role);

    const slug = await this.generateUniqueEnvironmentSlug(
      projectId,
      dto.slug ?? dto.name,
    );

    const environment = await this.prisma.projectEnvironment.create({
      data: {
        projectId,
        name: dto.name.trim(),
        slug,
        type: dto.type,
        baseUrl: dto.baseUrl,
        metadata: this.toJsonInput(dto.metadata),
        createdByUserId: user.id,
      },
      include: {
        project: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    await this.writeAuditLog(this.prisma, {
      action: 'project_environment.created',
      actorUserId: user.id,
      organizationId: access.project.organizationId,
      projectId,
      environmentId: environment.id,
      summary: `Created environment ${environment.name}`,
      targetId: environment.id,
      targetType: 'project_environment',
    });

    return this.serializeEnvironment(environment, environment.project, access.role);
  }

  async listApiKeys(
    walletAddress: string,
    filters: {
      organizationId?: string;
      projectId?: string;
      environmentId?: string;
    },
  ) {
    const user = await this.ensureUserForWallet(walletAddress);
    await this.assertTenantFilterAccess(user.id, filters);

    const apiKeys = await this.prisma.apiKey.findMany({
      where: {
        organization: {
          memberships: {
            some: { userId: user.id },
          },
        },
        ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.environmentId ? { environmentId: filters.environmentId } : {}),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        environment: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return apiKeys.map((apiKey) => this.serializeApiKey(apiKey));
  }

  async createApiKey(walletAddress: string, dto: CreateApiKeyDto) {
    const user = await this.ensureUserForWallet(walletAddress);
    const scope = await this.resolveTenantScope(user.id, dto);
    this.assertDeveloperWriteRole(scope.role);

    const key = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const prefix = key.slice(0, 10);
    const lastFour = key.slice(-4);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        keyHash: hashApiKey(key),
        prefix,
        lastFour,
        ownerId: user.id,
        organizationId: scope.organizationId,
        projectId: scope.projectId,
        environmentId: scope.environmentId,
        createdByUserId: user.id,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        scopes: dto.scopes ?? [],
        metadata: this.toJsonInput(dto.metadata),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        environment: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
      },
    });

    await this.writeAuditLog(this.prisma, {
      action: 'api_key.created',
      actorUserId: user.id,
      organizationId: scope.organizationId,
      projectId: scope.projectId,
      environmentId: scope.environmentId,
      metadata: {
        scopes: dto.scopes ?? [],
      },
      summary: `Created API key ${apiKey.name}`,
      targetId: apiKey.id,
      targetType: 'api_key',
    });

    return this.serializeApiKey(apiKey, key);
  }

  async revokeApiKey(walletAddress: string, keyId: string) {
    const user = await this.ensureUserForWallet(walletAddress);
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: keyId,
        organization: {
          memberships: {
            some: { userId: user.id },
          },
        },
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    const scope = await this.resolveTenantScope(user.id, {
      organizationId: apiKey.organizationId ?? undefined,
      projectId: apiKey.projectId ?? undefined,
      environmentId: apiKey.environmentId ?? undefined,
    });
    this.assertDeveloperWriteRole(scope.role);

    const revokedKey = await this.prisma.apiKey.update({
      where: { id: keyId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        environment: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
      },
    });

    await this.writeAuditLog(this.prisma, {
      action: 'api_key.revoked',
      actorUserId: user.id,
      organizationId: revokedKey.organizationId ?? undefined,
      projectId: revokedKey.projectId ?? undefined,
      environmentId: revokedKey.environmentId ?? undefined,
      summary: `Revoked API key ${revokedKey.name}`,
      targetId: revokedKey.id,
      targetType: 'api_key',
    });

    return this.serializeApiKey(revokedKey);
  }

  async listWebhooks(
    walletAddress: string,
    filters: {
      organizationId?: string;
      projectId?: string;
      environmentId?: string;
    },
  ) {
    const user = await this.ensureUserForWallet(walletAddress);
    await this.assertTenantFilterAccess(user.id, filters);

    const webhooks = await this.prisma.webhook.findMany({
      where: {
        organization: {
          memberships: {
            some: { userId: user.id },
          },
        },
        ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.environmentId ? { environmentId: filters.environmentId } : {}),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        environment: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return webhooks.map((webhook) => this.serializeWebhook(webhook));
  }

  async createWebhook(walletAddress: string, dto: CreateWebhookDto) {
    const user = await this.ensureUserForWallet(walletAddress);
    const scope = await this.resolveTenantScope(user.id, dto);
    this.assertDeveloperWriteRole(scope.role);

    const secret = dto.secret ?? crypto.randomBytes(24).toString('hex');
    const webhook = await this.prisma.webhook.create({
      data: {
        url: dto.url,
        secret,
        secretLastFour: secret.slice(-4),
        events: dto.events,
        ownerId: user.id,
        organizationId: scope.organizationId,
        projectId: scope.projectId,
        environmentId: scope.environmentId,
        createdByUserId: user.id,
        description: dto.description?.trim(),
        headers: this.toJsonInput(dto.headers),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        environment: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    await this.writeAuditLog(this.prisma, {
      action: 'webhook.created',
      actorUserId: user.id,
      organizationId: scope.organizationId,
      projectId: scope.projectId,
      environmentId: scope.environmentId,
      metadata: {
        events: dto.events,
        url: dto.url,
      },
      summary: `Created webhook for ${dto.url}`,
      targetId: webhook.id,
      targetType: 'webhook',
    });

    return this.serializeWebhook(webhook, secret);
  }

  async updateWebhook(
    walletAddress: string,
    webhookId: string,
    dto: UpdateWebhookDto,
  ) {
    const user = await this.ensureUserForWallet(walletAddress);
    const webhook = await this.prisma.webhook.findFirst({
      where: {
        id: webhookId,
        organization: {
          memberships: {
            some: { userId: user.id },
          },
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const scope = await this.resolveTenantScope(user.id, {
      organizationId: webhook.organizationId ?? undefined,
      projectId: webhook.projectId ?? undefined,
      environmentId: webhook.environmentId ?? undefined,
    });
    this.assertDeveloperWriteRole(scope.role);

    const nextSecret = dto.secret ?? undefined;
    const updatedWebhook = await this.prisma.webhook.update({
      where: { id: webhookId },
      data: {
        ...(dto.url ? { url: dto.url } : {}),
        ...(dto.events ? { events: dto.events } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ?? null }
          : {}),
        ...(dto.headers !== undefined
          ? { headers: this.toJsonInput(dto.headers) }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(nextSecret
          ? {
              secret: nextSecret,
              secretLastFour: nextSecret.slice(-4),
            }
          : {}),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        environment: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    await this.writeAuditLog(this.prisma, {
      action: 'webhook.updated',
      actorUserId: user.id,
      organizationId: updatedWebhook.organizationId ?? undefined,
      projectId: updatedWebhook.projectId ?? undefined,
      environmentId: updatedWebhook.environmentId ?? undefined,
      metadata: {
        changedFields: Object.keys(dto),
      },
      summary: `Updated webhook ${updatedWebhook.id}`,
      targetId: updatedWebhook.id,
      targetType: 'webhook',
    });

    return this.serializeWebhook(updatedWebhook, nextSecret);
  }

  async deleteWebhook(walletAddress: string, webhookId: string) {
    const user = await this.ensureUserForWallet(walletAddress);
    const webhook = await this.prisma.webhook.findFirst({
      where: {
        id: webhookId,
        organization: {
          memberships: {
            some: { userId: user.id },
          },
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        environment: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const scope = await this.resolveTenantScope(user.id, {
      organizationId: webhook.organizationId ?? undefined,
      projectId: webhook.projectId ?? undefined,
      environmentId: webhook.environmentId ?? undefined,
    });
    this.assertDeveloperWriteRole(scope.role);

    const archivedWebhook = await this.prisma.webhook.update({
      where: { id: webhookId },
      data: { isActive: false },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        environment: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    await this.writeAuditLog(this.prisma, {
      action: 'webhook.archived',
      actorUserId: user.id,
      organizationId: archivedWebhook.organizationId ?? undefined,
      projectId: archivedWebhook.projectId ?? undefined,
      environmentId: archivedWebhook.environmentId ?? undefined,
      summary: `Archived webhook ${archivedWebhook.id}`,
      targetId: archivedWebhook.id,
      targetType: 'webhook',
    });

    return this.serializeWebhook(archivedWebhook);
  }

  async listWebhookDeliveries(
    walletAddress: string,
    filters: {
      organizationId?: string;
      projectId?: string;
      environmentId?: string;
      webhookId?: string;
      take?: number;
    },
  ) {
    const user = await this.ensureUserForWallet(walletAddress);
    await this.assertTenantFilterAccess(user.id, filters);

    if (filters.webhookId) {
      const webhook = await this.prisma.webhook.findFirst({
        where: {
          id: filters.webhookId,
          organization: {
            memberships: {
              some: { userId: user.id },
            },
          },
        },
      });

      if (!webhook) {
        throw new NotFoundException('Webhook not found');
      }
    }

    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: {
        organization: {
          memberships: {
            some: { userId: user.id },
          },
        },
        ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.environmentId ? { environmentId: filters.environmentId } : {}),
        ...(filters.webhookId ? { webhookId: filters.webhookId } : {}),
      },
      include: {
        webhook: {
          select: {
            id: true,
            url: true,
            description: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: Math.min(filters.take ?? 50, 100),
    });

    return deliveries.map((delivery) => ({
      id: delivery.id,
      event: delivery.event,
      status: delivery.status,
      attemptCount: delivery.attemptCount,
      requestId: delivery.requestId,
      responseStatus: delivery.responseStatus,
      responseBody: delivery.responseBody,
      errorMessage: delivery.errorMessage,
      deliveredAt: delivery.deliveredAt,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
      organizationId: delivery.organizationId,
      projectId: delivery.projectId,
      environmentId: delivery.environmentId,
      payload: delivery.payload,
      webhook: delivery.webhook,
    }));
  }

  async replayWebhook(
    walletAddress: string,
    webhookId: string,
    dto: ReplayWebhookDto,
  ) {
    const user = await this.ensureUserForWallet(walletAddress);
    const webhook = await this.prisma.webhook.findFirst({
      where: {
        id: webhookId,
        organization: {
          memberships: {
            some: { userId: user.id },
          },
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const scope = await this.resolveTenantScope(user.id, {
      organizationId: webhook.organizationId ?? undefined,
      projectId: webhook.projectId ?? undefined,
      environmentId: webhook.environmentId ?? undefined,
    });
    this.assertDeveloperWriteRole(scope.role);

    const replayedDelivery = dto.deliveryId
      ? await this.webhookService.replayDelivery(dto.deliveryId, webhook.id)
      : await this.webhookService.replayLatestDeliveryForWebhook(webhook.id);

    await this.writeAuditLog(this.prisma, {
      action: 'webhook.delivery.replayed',
      actorUserId: user.id,
      organizationId: webhook.organizationId ?? undefined,
      projectId: webhook.projectId ?? undefined,
      environmentId: webhook.environmentId ?? undefined,
      metadata: {
        deliveryId: replayedDelivery.id,
      },
      summary: `Replayed delivery ${replayedDelivery.id}`,
      targetId: replayedDelivery.id,
      targetType: 'webhook_delivery',
    });

    return {
      id: replayedDelivery.id,
      event: replayedDelivery.event,
      status: replayedDelivery.status,
      attemptCount: replayedDelivery.attemptCount,
      responseStatus: replayedDelivery.responseStatus,
      errorMessage: replayedDelivery.errorMessage,
      deliveredAt: replayedDelivery.deliveredAt,
      createdAt: replayedDelivery.createdAt,
      updatedAt: replayedDelivery.updatedAt,
    };
  }

  private async ensureUserForWallet(walletAddress: string) {
    const normalizedAddress = walletAddress.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: {
        address: {
          equals: normalizedAddress,
          mode: 'insensitive',
        },
      },
    });

    if (existingUser) {
      return existingUser;
    }

    return this.prisma.user.create({
      data: { address: normalizedAddress },
    });
  }

  private async getOrganizationMembership(organizationId: string, userId: string) {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                apiKeys: true,
                memberships: true,
                projects: true,
                webhooks: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Organization not found');
    }

    return membership;
  }

  private async getProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organization: {
          memberships: {
            some: { userId },
          },
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            memberships: {
              where: { userId },
              select: { role: true },
              take: 1,
            },
          },
        },
        environments: {
          orderBy: [{ createdAt: 'asc' }],
        },
        _count: {
          select: {
            apiKeys: true,
            environments: true,
            escrows: true,
            webhooks: true,
          },
        },
      },
    });

    if (!project || !project.organization.memberships[0]) {
      throw new NotFoundException('Project not found');
    }

    return {
      project,
      role: project.organization.memberships[0].role,
    };
  }

  private async getEnvironmentAccess(environmentId: string, userId: string) {
    const environment = await this.prisma.projectEnvironment.findFirst({
      where: {
        id: environmentId,
        project: {
          organization: {
            memberships: {
              some: { userId },
            },
          },
        },
      },
      include: {
        project: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                memberships: {
                  where: { userId },
                  select: { role: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!environment || !environment.project.organization.memberships[0]) {
      throw new NotFoundException('Environment not found');
    }

    return {
      environment,
      role: environment.project.organization.memberships[0].role,
    };
  }

  private async resolveTenantScope(
    userId: string,
    scopeInput: {
      organizationId?: string;
      projectId?: string;
      environmentId?: string;
    },
  ): Promise<TenantScope> {
    const suppliedScopes = [
      scopeInput.organizationId,
      scopeInput.projectId,
      scopeInput.environmentId,
    ].filter(Boolean);

    if (suppliedScopes.length !== 1) {
      throw new BadRequestException(
        'Provide exactly one of organizationId, projectId, or environmentId',
      );
    }

    if (scopeInput.environmentId) {
      const access = await this.getEnvironmentAccess(scopeInput.environmentId, userId);
      return {
        organizationId: access.environment.project.organization.id,
        organizationName: access.environment.project.organization.name,
        organizationSlug: access.environment.project.organization.slug,
        projectId: access.environment.project.id,
        projectName: access.environment.project.name,
        projectSlug: access.environment.project.slug,
        environmentId: access.environment.id,
        environmentName: access.environment.name,
        environmentSlug: access.environment.slug,
        environmentType: access.environment.type,
        role: access.role,
      };
    }

    if (scopeInput.projectId) {
      const access = await this.getProjectAccess(scopeInput.projectId, userId);
      return {
        organizationId: access.project.organization.id,
        organizationName: access.project.organization.name,
        organizationSlug: access.project.organization.slug,
        projectId: access.project.id,
        projectName: access.project.name,
        projectSlug: access.project.slug,
        role: access.role,
      };
    }

    const membership = await this.getOrganizationMembership(
      scopeInput.organizationId!,
      userId,
    );
    return {
      organizationId: membership.organization.id,
      organizationName: membership.organization.name,
      organizationSlug: membership.organization.slug,
      role: membership.role,
    };
  }

  private async assertTenantFilterAccess(
    userId: string,
    filters: {
      organizationId?: string;
      projectId?: string;
      environmentId?: string;
    },
  ) {
    if (filters.environmentId) {
      await this.getEnvironmentAccess(filters.environmentId, userId);
      return;
    }

    if (filters.projectId) {
      await this.getProjectAccess(filters.projectId, userId);
      return;
    }

    if (filters.organizationId) {
      await this.getOrganizationMembership(filters.organizationId, userId);
    }
  }

  private assertOrganizationAdminRole(role: MembershipRole) {
    if (role !== MembershipRole.OWNER && role !== MembershipRole.ADMIN) {
      throw new ForbiddenException(
        'This action requires organization admin access',
      );
    }
  }

  private assertDeveloperWriteRole(role: MembershipRole) {
    if (role === MembershipRole.VIEWER) {
      throw new ForbiddenException('This action requires write access');
    }
  }

  private serializeOrganization(
    organization: {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      metadata?: Prisma.JsonValue | null;
      createdAt: Date;
      updatedAt: Date;
      _count?: {
        apiKeys: number;
        memberships: number;
        projects: number;
        webhooks: number;
      };
    },
    role?: MembershipRole,
  ) {
    return {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      description: organization.description,
      role,
      metadata: organization.metadata ?? null,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      counts: organization._count
        ? {
            apiKeys: organization._count.apiKeys,
            members: organization._count.memberships,
            projects: organization._count.projects,
            webhooks: organization._count.webhooks,
          }
        : undefined,
    };
  }

  private serializeProject(
    project: {
      id: string;
      organizationId: string;
      slug: string;
      name: string;
      description: string | null;
      metadata?: Prisma.JsonValue | null;
      createdAt: Date;
      updatedAt: Date;
      organization: {
        id: string;
        name: string;
        slug: string;
      };
      environments?: Array<{
        id: string;
        slug: string;
        name: string;
        type: ProjectEnvironmentType;
        baseUrl: string | null;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
      }>;
      _count?: {
        apiKeys: number;
        environments: number;
        escrows: number;
        webhooks: number;
      };
    },
    role?: MembershipRole,
  ) {
    return {
      id: project.id,
      organizationId: project.organizationId,
      slug: project.slug,
      name: project.name,
      description: project.description,
      role,
      metadata: project.metadata ?? null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      organization: project.organization,
      environments: project.environments?.map((environment) =>
        this.serializeEnvironment(environment, project, role),
      ),
      counts: project._count
        ? {
            apiKeys: project._count.apiKeys,
            environments: project._count.environments,
            escrows: project._count.escrows,
            webhooks: project._count.webhooks,
          }
        : undefined,
    };
  }

  private serializeEnvironment(
    environment: {
      id: string;
      projectId?: string;
      slug: string;
      name: string;
      type: ProjectEnvironmentType;
      baseUrl: string | null;
      metadata: Prisma.JsonValue | null;
      createdAt: Date;
      updatedAt: Date;
    },
    project: {
      id: string;
      slug: string;
      name: string;
      organizationId?: string;
      organization?: {
        id: string;
        slug: string;
        name: string;
      };
    },
    role?: MembershipRole,
  ) {
    return {
      id: environment.id,
      projectId: environment.projectId ?? project.id,
      slug: environment.slug,
      name: environment.name,
      type: environment.type,
      role,
      baseUrl: environment.baseUrl,
      metadata: environment.metadata ?? null,
      createdAt: environment.createdAt,
      updatedAt: environment.updatedAt,
      project: {
        id: project.id,
        slug: project.slug,
        name: project.name,
      },
      organization: project.organization,
    };
  }

  private serializeApiKey(
    apiKey: {
      id: string;
      prefix: string;
      lastFour: string;
      organizationId: string | null;
      projectId: string | null;
      environmentId: string | null;
      name: string;
      description: string | null;
      scopes: string[];
      metadata: Prisma.JsonValue | null;
      isActive: boolean;
      lastUsedAt: Date | null;
      revokedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      organization?: {
        id: string;
        name: string;
        slug: string;
      } | null;
      project?: {
        id: string;
        name: string;
        slug: string;
      } | null;
      environment?: {
        id: string;
        name: string;
        slug: string;
        type: ProjectEnvironmentType;
      } | null;
    },
    rawKey?: string,
  ) {
    return {
      id: apiKey.id,
      name: apiKey.name,
      description: apiKey.description,
      scopes: apiKey.scopes,
      metadata: apiKey.metadata ?? null,
      maskedKey: maskApiKey(apiKey.prefix, apiKey.lastFour),
      prefix: apiKey.prefix,
      lastFour: apiKey.lastFour,
      organizationId: apiKey.organizationId,
      projectId: apiKey.projectId,
      environmentId: apiKey.environmentId,
      isActive: apiKey.isActive,
      lastUsedAt: apiKey.lastUsedAt,
      revokedAt: apiKey.revokedAt,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      organization: apiKey.organization ?? null,
      project: apiKey.project ?? null,
      environment: apiKey.environment ?? null,
      ...(rawKey ? { key: rawKey } : {}),
    };
  }

  private serializeWebhook(
    webhook: {
      id: string;
      url: string;
      events: string[];
      secretLastFour: string | null;
      organizationId: string | null;
      projectId: string | null;
      environmentId: string | null;
      description: string | null;
      headers: Prisma.JsonValue | null;
      isActive: boolean;
      lastTriggeredAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      organization?: {
        id: string;
        name: string;
        slug: string;
      } | null;
      project?: {
        id: string;
        name: string;
        slug: string;
      } | null;
      environment?: {
        id: string;
        name: string;
        slug: string;
        type: ProjectEnvironmentType;
      } | null;
      _count?: {
        deliveries: number;
      };
    },
    rawSecret?: string,
  ) {
    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      description: webhook.description,
      headers: webhook.headers ?? null,
      organizationId: webhook.organizationId,
      projectId: webhook.projectId,
      environmentId: webhook.environmentId,
      isActive: webhook.isActive,
      secretLastFour: webhook.secretLastFour,
      lastTriggeredAt: webhook.lastTriggeredAt,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      organization: webhook.organization ?? null,
      project: webhook.project ?? null,
      environment: webhook.environment ?? null,
      deliveryCount: webhook._count?.deliveries,
      ...(rawSecret ? { secret: rawSecret } : {}),
    };
  }

  private async generateUniqueOrganizationSlug(seed: string) {
    return this.generateUniqueSlug(this.slugify(seed), async (candidate) => {
      const existing = await this.prisma.organization.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      return Boolean(existing);
    });
  }

  private async generateUniqueProjectSlug(
    organizationId: string,
    seed: string,
    excludeProjectId?: string,
  ) {
    return this.generateUniqueSlug(this.slugify(seed), async (candidate) => {
      const existing = await this.prisma.project.findFirst({
        where: {
          organizationId,
          slug: candidate,
          ...(excludeProjectId ? { NOT: { id: excludeProjectId } } : {}),
        },
        select: { id: true },
      });
      return Boolean(existing);
    });
  }

  private async generateUniqueEnvironmentSlug(projectId: string, seed: string) {
    return this.generateUniqueSlug(this.slugify(seed), async (candidate) => {
      const existing = await this.prisma.projectEnvironment.findFirst({
        where: {
          projectId,
          slug: candidate,
        },
        select: { id: true },
      });
      return Boolean(existing);
    });
  }

  private async generateUniqueSlug(
    baseSlug: string,
    exists: (candidate: string) => Promise<boolean>,
  ) {
    const slug = baseSlug || 'tenant';
    if (!(await exists(slug))) {
      return slug;
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
      if (!(await exists(candidate))) {
        return candidate;
      }
    }

    throw new BadRequestException('Unable to generate a unique slug');
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  private toJsonInput(
    value?: Record<string, unknown>,
  ): Prisma.InputJsonValue | undefined {
    return value as Prisma.InputJsonValue | undefined;
  }

  private async writeAuditLog(
    client: AuditClient,
    input: {
      action: string;
      actorUserId: string;
      organizationId?: string;
      projectId?: string;
      environmentId?: string;
      targetType: string;
      targetId?: string;
      summary?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await client.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorUserId,
        actorType: AuditActorType.USER,
        actorUserId: input.actorUserId,
        organizationId: input.organizationId,
        projectId: input.projectId,
        environmentId: input.environmentId,
        targetType: input.targetType,
        targetId: input.targetId,
        summary: input.summary,
        metadata: this.toJsonInput(input.metadata),
      },
    });
  }
}
