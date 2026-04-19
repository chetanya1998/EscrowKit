import { Injectable, UnauthorizedException } from '@nestjs/common';
import { generateNonce, SiweMessage } from 'siwe';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

interface TokenPayload {
    walletAddress?: string;
    nonce?: string;
    iat: number;
    exp: number;
}

function base64UrlEncode(value: string): string {
    return Buffer.from(value)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function base64UrlDecode(value: string): string {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return Buffer.from(padded, 'base64').toString('utf8');
}

@Injectable()
export class AuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-do-not-use-in-prod';
    private readonly SESSION_EXPIRATION_SECONDS = 7 * 24 * 60 * 60;
    private readonly NONCE_EXPIRATION_SECONDS = 5 * 60;

    constructor(private readonly prisma: PrismaService) { }

    generateNonce() {
        const nonce = generateNonce();
        const nonceToken = this.signToken({ nonce }, this.NONCE_EXPIRATION_SECONDS);
        return { nonce, nonceToken };
    }

    async verifySiwe(messageStr: string, signature: string, nonceToken: string) {
        // 1. Verify nonce token
        let expectedNonce: string;
        try {
            const decoded = this.verifySignedToken(nonceToken);
            if (!decoded.nonce) {
                throw new UnauthorizedException('Nonce missing from token');
            }
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
        const sessionToken = this.signToken({ walletAddress }, this.SESSION_EXPIRATION_SECONDS);

        return sessionToken;
    }

    async guestLogin(deviceId: string) {
        // 1. Generate a "guest address"
        const guestAddress = `guest:${deviceId}`;

        // 2. Find or create the guest user using upsert
        const user = await this.prisma.user.upsert({
            where: { address: guestAddress },
            update: { deviceId: deviceId, isGuest: true },
            create: {
                address: guestAddress,
                deviceId: deviceId,
                isGuest: true,
                username: `Guest_${deviceId.slice(0, 8)}`,
            },
        });

        // 3. Issue Session JWT
        const sessionToken = this.signToken({ walletAddress: guestAddress }, this.SESSION_EXPIRATION_SECONDS);

        return { token: sessionToken, user };
    }

    verifySessionToken(token: string): any {
        try {
            return this.verifySignedToken(token);
        } catch (e) {
            throw new UnauthorizedException('Invalid session token');
        }
    }

    private signToken(payload: Pick<TokenPayload, 'walletAddress' | 'nonce'>, expiresInSeconds: number): string {
        const issuedAt = Math.floor(Date.now() / 1000);
        const fullPayload: TokenPayload = {
            ...payload,
            iat: issuedAt,
            exp: issuedAt + expiresInSeconds,
        };

        const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = base64UrlEncode(JSON.stringify(fullPayload));
        const signature = crypto
            .createHmac('sha256', this.JWT_SECRET)
            .update(`${header}.${body}`)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');

        return `${header}.${body}.${signature}`;
    }

    private verifySignedToken(token: string): TokenPayload {
        const [header, body, signature] = token.split('.');

        if (!header || !body || !signature) {
            throw new UnauthorizedException('Malformed token');
        }

        const expectedSignature = crypto
            .createHmac('sha256', this.JWT_SECRET)
            .update(`${header}.${body}`)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');

        if (expectedSignature !== signature) {
            throw new UnauthorizedException('Invalid token signature');
        }

        const payload = JSON.parse(base64UrlDecode(body)) as TokenPayload;
        if (payload.exp <= Math.floor(Date.now() / 1000)) {
            throw new UnauthorizedException('Token expired');
        }

        return payload;
    }
}
