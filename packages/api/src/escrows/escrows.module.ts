import { Module } from '@nestjs/common';
import { EscrowsController } from './escrows.controller';
import { EscrowsService } from './escrows.service';
import { MilestoneDraftsController } from './milestone-drafts.controller';
import { MilestoneDraftsService } from './milestone-drafts.service';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [EscrowsController, MilestoneDraftsController, DisputesController],
    providers: [EscrowsService, MilestoneDraftsService, DisputesService],
})
export class EscrowsModule { }
