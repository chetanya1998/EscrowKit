import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async signup(email: string, password: string, username?: string) {
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        if (username) {
            const existingUsername = await this.prisma.user.findUnique({ where: { username } });
            if (existingUsername) {
                throw new ConflictException('Username already taken');
            }
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                username,
                authProvider: 'local',
            },
        });

        return this.generateTokenResponse(user);
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        return this.generateTokenResponse(user);
    }

    async validateGoogleUser(profile: {
        googleId: string;
        email: string;
        displayName?: string;
        avatar?: string;
    }) {
        let user = await this.prisma.user.findUnique({
            where: { googleId: profile.googleId },
        });

        if (!user) {
            // Check if a user with this email already exists (registered via email)
            user = await this.prisma.user.findUnique({
                where: { email: profile.email },
            });

            if (user) {
                // Link Google account to existing email user
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: profile.googleId,
                        avatar: user.avatar || profile.avatar,
                    },
                });
            } else {
                // Create new user from Google profile
                user = await this.prisma.user.create({
                    data: {
                        email: profile.email,
                        googleId: profile.googleId,
                        username: profile.displayName?.replace(/\s+/g, '_').toLowerCase(),
                        avatar: profile.avatar,
                        authProvider: 'google',
                    },
                });
            }
        }

        return this.generateTokenResponse(user);
    }

    async validateJwtPayload(payload: { sub: string }) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user) throw new UnauthorizedException();
        return user;
    }

    async getProfile(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                address: true,
                avatar: true,
                bio: true,
                authProvider: true,
                createdAt: true,
            },
        });
    }

    private generateTokenResponse(user: { id: string; email?: string | null; username?: string | null }) {
        const payload = { sub: user.id, email: user.email };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        };
    }
}
