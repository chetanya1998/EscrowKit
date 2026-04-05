import {
  Body,
  Controller,
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
  CreateProjectDto,
  CreateProjectEnvironmentDto,
  UpdateProjectDto,
} from './developer-platform.dto';
import { DeveloperPlatformService } from './developer-platform.service';

@Controller('api/v1/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly developerPlatformService: DeveloperPlatformService,
  ) {}

  @Get()
  listProjects(
    @Request() request: any,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.developerPlatformService.listProjects(
      request.user.walletAddress,
      organizationId,
    );
  }

  @Post()
  createProject(@Request() request: any, @Body() body: CreateProjectDto) {
    return this.developerPlatformService.createProject(
      request.user.walletAddress,
      body,
    );
  }

  @Get(':projectId')
  getProject(@Request() request: any, @Param('projectId') projectId: string) {
    return this.developerPlatformService.getProject(
      request.user.walletAddress,
      projectId,
    );
  }

  @Patch(':projectId')
  updateProject(
    @Request() request: any,
    @Param('projectId') projectId: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.developerPlatformService.updateProject(
      request.user.walletAddress,
      projectId,
      body,
    );
  }

  @Get(':projectId/environments')
  listProjectEnvironments(
    @Request() request: any,
    @Param('projectId') projectId: string,
  ) {
    return this.developerPlatformService.listProjectEnvironments(
      request.user.walletAddress,
      projectId,
    );
  }

  @Post(':projectId/environments')
  createProjectEnvironment(
    @Request() request: any,
    @Param('projectId') projectId: string,
    @Body() body: CreateProjectEnvironmentDto,
  ) {
    return this.developerPlatformService.createProjectEnvironment(
      request.user.walletAddress,
      projectId,
      body,
    );
  }
}
