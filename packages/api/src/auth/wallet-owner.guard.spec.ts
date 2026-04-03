import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { WalletOwnerGuard } from './wallet-owner.guard';

function createExecutionContext(walletAddress: string, requestedAddress: string): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => ({
                user: { walletAddress },
                params: { address: requestedAddress },
            }),
        }),
    } as ExecutionContext;
}

describe('WalletOwnerGuard', () => {
    it('allows requests for the authenticated wallet', () => {
        const guard = new WalletOwnerGuard();

        expect(guard.canActivate(createExecutionContext('0xABC', '0xabc'))).toBe(true);
    });

    it('rejects requests for a different wallet', () => {
        const guard = new WalletOwnerGuard();

        expect(() => guard.canActivate(createExecutionContext('0xABC', '0xdef'))).toThrow(ForbiddenException);
    });
});
