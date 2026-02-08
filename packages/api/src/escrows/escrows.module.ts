import { Module } from '@nestjs/common';
import { EscrowsController } from './escrows.controller';
import { EscrowsService } from './escrows.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [EscrowsController],
    providers: [EscrowsService],
})
export class EscrowsModule { }
