import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EscrowsModule } from './escrows/escrows.module';
import { EvidenceController } from './evidence/evidence.controller';
import { UsersModule } from './users/users.module';

@Module({
  imports: [EscrowsModule, UsersModule],
  controllers: [AppController, EvidenceController],
  providers: [AppService],
})
export class AppModule { }
