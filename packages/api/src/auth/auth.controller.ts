import { Controller, Get, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

class VerifyDto {
    message: string;
    signature: string;
    nonceToken: string;
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
}
