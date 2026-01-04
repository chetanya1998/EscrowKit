import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EscrowsModule } from './escrows/escrows.module';
import { EvidenceController } from './evidence/evidence.controller';

@Module({
  imports: [EscrowsModule],
  controllers: [AppController, EvidenceController],
  providers: [AppService],
})
export class AppModule { }
