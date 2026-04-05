import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import {
  CreateApiKeyDto,
  CreateWebhookDto,
  ReplayWebhookDto,
  UpdateWebhookDto,
} from './developer-platform.dto';
import { DeveloperPlatformService } from './developer-platform.service';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class DeveloperIntegrationsController {
  constructor(
    private readonly developerPlatformService: DeveloperPlatformService,
  ) {}

  @Get('api-keys')
  listApiKeys(
    @Request() request: any,
    @Query('organizationId') organizationId?: string,
    @Query('projectId') projectId?: string,
    @Query('environmentId') environmentId?: string,
  ) {
    return this.developerPlatformService.listApiKeys(
      request.user.walletAddress,
      {
        organizationId,
        projectId,
        environmentId,
      },
    );
  }

  @Post('api-keys')
  createApiKey(@Request() request: any, @Body() body: CreateApiKeyDto) {
    return this.developerPlatformService.createApiKey(
      request.user.walletAddress,
      body,
    );
  }

  @Delete('api-keys/:keyId')
  revokeApiKey(@Request() request: any, @Param('keyId') keyId: string) {
    return this.developerPlatformService.revokeApiKey(
      request.user.walletAddress,
      keyId,
    );
  }

  @Get('webhooks')
  listWebhooks(
    @Request() request: any,
    @Query('organizationId') organizationId?: string,
    @Query('projectId') projectId?: string,
    @Query('environmentId') environmentId?: string,
  ) {
    return this.developerPlatformService.listWebhooks(
      request.user.walletAddress,
      {
        organizationId,
        projectId,
        environmentId,
      },
    );
  }

  @Post('webhooks')
  createWebhook(@Request() request: any, @Body() body: CreateWebhookDto) {
    return this.developerPlatformService.createWebhook(
      request.user.walletAddress,
      body,
    );
  }

  @Patch('webhooks/:webhookId')
  updateWebhook(
    @Request() request: any,
    @Param('webhookId') webhookId: string,
    @Body() body: UpdateWebhookDto,
  ) {
    return this.developerPlatformService.updateWebhook(
      request.user.walletAddress,
      webhookId,
      body,
    );
  }

  @Delete('webhooks/:webhookId')
  deleteWebhook(@Request() request: any, @Param('webhookId') webhookId: string) {
    return this.developerPlatformService.deleteWebhook(
      request.user.walletAddress,
      webhookId,
    );
  }

  @Get('webhook-deliveries')
  listWebhookDeliveries(
    @Request() request: any,
    @Query('organizationId') organizationId?: string,
    @Query('projectId') projectId?: string,
    @Query('environmentId') environmentId?: string,
    @Query('webhookId') webhookId?: string,
    @Query('take') take?: string,
  ) {
    return this.developerPlatformService.listWebhookDeliveries(
      request.user.walletAddress,
      {
        organizationId,
        projectId,
        environmentId,
        webhookId,
        take: take ? Number(take) : undefined,
      },
    );
  }

  @Post('webhooks/:webhookId/replay')
  replayWebhook(
    @Request() request: any,
    @Param('webhookId') webhookId: string,
    @Body() body: ReplayWebhookDto,
  ) {
    return this.developerPlatformService.replayWebhook(
      request.user.walletAddress,
      webhookId,
      body,
    );
  }
}
