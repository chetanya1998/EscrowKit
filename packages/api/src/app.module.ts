import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EscrowsModule } from './escrows/escrows.module';
import { EvidenceModule } from './evidence/evidence.module';
import { PulsarModule } from './pulsar/pulsar.module';
import { UsersModule } from './users/users.module';
import { PublicApiModule } from './public-api/public-api.module';
import { WebhookModule } from './webhook/webhook.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, EscrowsModule, UsersModule, EvidenceModule, PulsarModule, PublicApiModule, WebhookModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
