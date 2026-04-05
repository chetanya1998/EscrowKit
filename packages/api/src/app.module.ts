import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EscrowsModule } from './escrows/escrows.module';
import { EvidenceModule } from './evidence/evidence.module';
import { PulsarModule } from './pulsar/pulsar.module';
import { UsersModule } from './users/users.module';
import { PublicApiModule } from './public-api/public-api.module';
import { WebhookModule } from './webhook/webhook.module';
import { AuthModule } from './auth/auth.module';
import { DeveloperPlatformModule } from './developer-platform/developer-platform.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute
    }]),
    EscrowsModule,
    UsersModule,
    EvidenceModule,
    PulsarModule,
    PublicApiModule,
    WebhookModule,
    AuthModule,
    DeveloperPlatformModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule { }
