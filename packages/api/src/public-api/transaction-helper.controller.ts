
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { encodeFunctionData, parseEther } from 'viem';

// ABI Fragments (simplified for example, usually imported from JSON)
const ESCROW_ABI = [
    {
        "type": "function",
        "name": "releaseMilestone",
        "inputs": [{ "name": "_milestoneId", "type": "uint256" }],
        "outputs": []
    },
    {
        "type": "function",
        "name": "fund",
        "inputs": [],
        "outputs": [],
        "stateMutability": "payable"
    }
];

// Factory ABI
const FACTORY_ABI = [
    {
        "type": "function",
        "name": "deployEscrow",
        "inputs": [
            { "name": "_payee", "type": "address" },
            { "name": "_arbiter", "type": "address" },
            { "name": "_arbitrationAdapter", "type": "address" },
            { "name": "_milestoneAmounts", "type": "uint256[]" },
            { "name": "_milestoneDescriptions", "type": "string[]" }
        ],
        "outputs": [{ "name": "", "type": "address" }]
    }
];


@Controller('api/v1/transactions')
@UseGuards(ApiKeyGuard)
export class TransactionHelperController {

    @Post('deploy')
    getDeployCallData(@Body() body: { payee: string, arbiter: string, amounts: string[], descriptions: string[] }) {
        // Generate calldata for factory.deployEscrow
        // Assuming Factory address is constant or passed in config
        const factoryAddress = process.env.FACTORY_ADDRESS || "0xFactory...";

        // Validate inputs...

        const data = encodeFunctionData({
            abi: FACTORY_ABI,
            functionName: 'deployEscrow',
            args: [
                body.payee as `0x${string}`,
                body.arbiter as `0x${string}`,
                "0x0000000000000000000000000000000000000000" as `0x${string}`, // Default adapter
                body.amounts.map(a => parseEther(a)),
                body.descriptions
            ]
        });

        return {
            to: factoryAddress,
            data,
            value: "0" // Deployment itself might not successfully send value depending on implementation
        };
    }

    @Post('release')
    getReleaseCallData(@Body() body: { escrowAddress: string, milestoneId: number }) {
        const data = encodeFunctionData({
            abi: ESCROW_ABI,
            functionName: 'releaseMilestone',
            args: [BigInt(body.milestoneId)]
        });

        return {
            to: body.escrowAddress,
            data
        };
    }
}
