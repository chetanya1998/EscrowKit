import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { FactoryV2ABI, MilestoneEscrowV2ABI, resolveDeployments } from '@escrowkit/protocol';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { encodeFunctionData, zeroAddress, zeroHash } from 'viem';

type DeployEscrowBody = {
    payee: string;
    arbiter?: string;
    arbitrationAdapter?: string;
    verificationOracle?: string;
    token?: string;
    detailsHash?: `0x${string}`;
    config?: {
        arbitrationFeeBps?: string;
        payerPenaltyBps?: string;
        payeePenaltyBps?: string;
        disputeWindow?: string;
        reviewPeriod?: string;
    };
    milestones: Array<{
        amount: string;
        description: string;
        deadline: string;
        conditionHash?: `0x${string}`;
    }>;
};

@Controller('api/v1/transactions')
@UseGuards(ApiKeyGuard)
export class TransactionHelperController {
    @Post('deploy')
    getDeployCallData(@Body() body: DeployEscrowBody) {
        const deployments = resolveDeployments(
            Number(process.env.CHAIN_ID ?? 84532),
            {
                primaryFactoryAddress: process.env.FACTORY_ADDRESS as `0x${string}` | undefined,
                verificationOracleAddress: process.env.VERIFICATION_ORACLE_ADDRESS as `0x${string}` | undefined,
                arbiterAdapterAddress: process.env.ARBITER_ADAPTER_ADDRESS as `0x${string}` | undefined,
            }
        );

        if (!deployments.primaryFactoryAddress) {
            throw new Error('Factory address is not configured');
        }

        const data = encodeFunctionData({
            abi: FactoryV2ABI,
            functionName: 'createEscrow',
            args: [
                body.payee as `0x${string}`,
                (body.arbiter ?? zeroAddress) as `0x${string}`,
                (body.arbitrationAdapter ?? deployments.arbiterAdapterAddress ?? zeroAddress) as `0x${string}`,
                (body.detailsHash ?? zeroHash) as `0x${string}`,
                (body.verificationOracle ?? deployments.verificationOracleAddress ?? zeroAddress) as `0x${string}`,
                (body.token ?? zeroAddress) as `0x${string}`,
                {
                    arbitrationFeeBps: BigInt(body.config?.arbitrationFeeBps ?? '0'),
                    payerPenaltyBps: BigInt(body.config?.payerPenaltyBps ?? '0'),
                    payeePenaltyBps: BigInt(body.config?.payeePenaltyBps ?? '0'),
                    disputeWindow: BigInt(body.config?.disputeWindow ?? '0'),
                    reviewPeriod: BigInt(body.config?.reviewPeriod ?? '0'),
                },
                body.milestones.map((milestone) => BigInt(milestone.amount)),
                body.milestones.map((milestone) => milestone.description),
                body.milestones.map((milestone) => BigInt(milestone.deadline)),
                body.milestones.map((milestone) => (milestone.conditionHash ?? zeroHash) as `0x${string}`),
            ]
        });

        return {
            to: deployments.primaryFactoryAddress,
            data,
            value: '0'
        };
    }

    @Post('release')
    getReleaseCallData(@Body() body: { escrowAddress: string; milestoneId: number }) {
        const data = encodeFunctionData({
            abi: MilestoneEscrowV2ABI,
            functionName: 'releaseMilestone',
            args: [BigInt(body.milestoneId)]
        });

        return {
            to: body.escrowAddress,
            data
        };
    }
}
