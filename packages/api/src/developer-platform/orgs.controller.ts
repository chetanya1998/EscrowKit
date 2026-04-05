import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import {
  AddOrganizationMemberDto,
  CreateOrganizationDto,
} from './developer-platform.dto';
import { DeveloperPlatformService } from './developer-platform.service';

@Controller('api/v1/orgs')
@UseGuards(JwtAuthGuard)
export class OrgsController {
  constructor(
    private readonly developerPlatformService: DeveloperPlatformService,
  ) {}

  @Get()
  listOrganizations(@Request() request: any) {
    return this.developerPlatformService.listOrganizations(
      request.user.walletAddress,
    );
  }

  @Post()
  createOrganization(
    @Request() request: any,
    @Body() body: CreateOrganizationDto,
  ) {
    return this.developerPlatformService.createOrganization(
      request.user.walletAddress,
      body,
    );
  }

  @Get(':orgId/members')
  getMembers(@Request() request: any, @Param('orgId') orgId: string) {
    return this.developerPlatformService.getOrganizationMembers(
      request.user.walletAddress,
      orgId,
    );
  }

  @Post(':orgId/members')
  addMember(
    @Request() request: any,
    @Param('orgId') orgId: string,
    @Body() body: AddOrganizationMemberDto,
  ) {
    return this.developerPlatformService.addOrganizationMember(
      request.user.walletAddress,
      orgId,
      body,
    );
  }
}
