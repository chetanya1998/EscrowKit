
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (!apiKey) {
            throw new UnauthorizedException('API Key (x-api-key) is missing');
        }

        const keyRecord = await this.prisma.apiKey.findUnique({
            where: { key: apiKey },
        });

        if (!keyRecord || !keyRecord.isActive) {
            throw new UnauthorizedException('Invalid or inactive API Key');
        }

        // Attach user/owner info to request for controllers to use
        request['apiKeyOwnerId'] = keyRecord.ownerId;
        return true;
    }
}
