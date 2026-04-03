import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class WalletOwnerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authenticatedAddress = request.user?.walletAddress;
        const requestedAddress = request.params?.address;

        if (!authenticatedAddress) {
            throw new UnauthorizedException('Missing authenticated wallet');
        }

        if (!requestedAddress) {
            throw new UnauthorizedException('Missing wallet address parameter');
        }

        if (authenticatedAddress.toLowerCase() !== requestedAddress.toLowerCase()) {
            throw new ForbiddenException('You can only access resources owned by your wallet');
        }

        return true;
    }
}
