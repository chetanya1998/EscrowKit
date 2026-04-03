import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { WalletOwnerGuard } from './wallet-owner.guard';

@Module({
    controllers: [AuthController],
    providers: [AuthService, JwtAuthGuard, WalletOwnerGuard],
    exports: [AuthService, JwtAuthGuard, WalletOwnerGuard],
})
export class AuthModule { }
