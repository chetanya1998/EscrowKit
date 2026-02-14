
import { Module } from '@nestjs/common';
import { PulsarService } from './pulsar.service';
import { EvidenceModule } from '../evidence/evidence.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        EvidenceModule,
        ScheduleModule.forRoot()
    ],
    providers: [PulsarService],
})
export class PulsarModule { }
