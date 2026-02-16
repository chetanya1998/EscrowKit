import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaModule } from '../prisma/prisma.module';

// Conditionally include GoogleStrategy only if credentials are provided
const providers: any[] = [AuthService, JwtStrategy];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(GoogleStrategy);
}

@Module({
    imports: [
        PrismaModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [AuthController],
    providers,
    exports: [AuthService, JwtModule],
})
export class AuthModule { }

