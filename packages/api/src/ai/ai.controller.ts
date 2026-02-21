import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';

export class GenerateEscrowDto {
    prompt?: string;
    predefinedTemplate?: string;
}

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('generate-escrow')
    async generateEscrow(@Body() body: GenerateEscrowDto) {
        return this.aiService.generateEscrowConfig(body.prompt, body.predefinedTemplate);
    }

    @Get('exchange-rate')
    async getExchangeRate(
        @Query('from') from: string,
        @Query('to') to: string
    ) {
        return this.aiService.getExchangeRate(from, to);
    }
}
