import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeveloperIntegrationsController } from './developer-integrations.controller';
import { OrgsController } from './orgs.controller';
import { ProjectsController } from './projects.controller';
import { DeveloperPlatformService } from './developer-platform.service';

@Module({
  imports: [AuthModule],
  controllers: [
    OrgsController,
    ProjectsController,
    DeveloperIntegrationsController,
  ],
  providers: [DeveloperPlatformService],
  exports: [DeveloperPlatformService],
})
export class DeveloperPlatformModule {}
