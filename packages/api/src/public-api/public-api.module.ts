
import { Module } from '@nestjs/common';
import { PublicEscrowsController } from './public-escrows.controller';
import { TransactionHelperController } from './transaction-helper.controller';

@Module({
    controllers: [PublicEscrowsController, TransactionHelperController],
    providers: [],
})
export class PublicApiModule { }
