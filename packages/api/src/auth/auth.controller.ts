import { Controller, Get, Post, Body, UnauthorizedException, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';

class VerifyDto {
    message: string;
    signature: string;
    nonceToken: string;
}

class GuestLoginDto {
    deviceId: string;
}

@Controller('api/v1/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('nonce')
    getNonce() {
        return this.authService.generateNonce();
    }

    @Post('verify')
    async verify(@Body() body: VerifyDto) {
        try {
            const token = await this.authService.verifySiwe(body.message, body.signature, body.nonceToken);
            return { token };
        } catch (error) {
            throw new UnauthorizedException(error.message || 'Invalid signature');
        }
    }

    @Post('guest')
    async guestLogin(@Body() body: GuestLoginDto) {
        try {
            return await this.authService.guestLogin(body.deviceId);
        } catch (error) {
            throw new UnauthorizedException(error.message || 'Guest login failed');
        }
    }

    @Get('session')
    @UseGuards(JwtAuthGuard)
    getSession(@Request() request: { user: { walletAddress: string; expiresAt: string | null } }) {
        return {
            walletAddress: request.user.walletAddress,
            valid: true,
            expiresAt: request.user.expiresAt,
        };
    }
}
