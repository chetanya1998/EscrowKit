import { Injectable, UnauthorizedException } from '@nestjs/common';
import { generateNonce, SiweMessage } from 'siwe';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-do-not-use-in-prod';
    private readonly SESSION_EXPIRATION = '7d';

    generateNonce() {
        const nonce = generateNonce();
        // Stateless nonce generation
        const nonceToken = jwt.sign({ nonce }, this.JWT_SECRET, { expiresIn: '5m' });
        return { nonce, nonceToken };
    }

    async verifySiwe(messageStr: string, signature: string, nonceToken: string) {
        // 1. Verify nonce token
        let expectedNonce: string;
        try {
            const decoded = jwt.verify(nonceToken, this.JWT_SECRET) as { nonce: string };
            expectedNonce = decoded.nonce;
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired nonce token');
        }

        // 2. Parse and verify SIWE message
        const message = new SiweMessage(messageStr);
        try {
            const validationResult = await message.verify({ signature, nonce: expectedNonce });
            if (!validationResult.success) {
                throw new Error('SIWE verification failed');
            }
        } catch (e) {
            throw new UnauthorizedException(`Invalid signature: ${e.message}`);
        }

        // 3. Ensure expiration is valid
        if (message.expirationTime && new Date(message.expirationTime) <= new Date()) {
            throw new UnauthorizedException('Message expired');
        }

        // 4. Issue Session JWT
        const walletAddress = message.address;
        const sessionToken = jwt.sign({ walletAddress }, this.JWT_SECRET, { expiresIn: this.SESSION_EXPIRATION });

        return sessionToken;
    }

    verifySessionToken(token: string): any {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (e) {
            throw new UnauthorizedException('Invalid session token');
        }
    }
}
