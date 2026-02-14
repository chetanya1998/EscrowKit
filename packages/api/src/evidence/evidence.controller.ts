import { Controller, Post, Get, Param, UploadedFile, UseInterceptors, Res, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EvidenceService } from './evidence.service';
import type { Response } from 'express';
import * as path from 'path';

@Controller('evidence')
export class EvidenceController {
    constructor(private readonly evidenceService: EvidenceService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadEvidence(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new Error('File is required');
        const { hash, filename } = await this.evidenceService.storeFile(file);

        // Mock IPFS URL
        const url = `http://localhost:3000/evidence/${filename}`;

        return {
            success: true,
            hash,
            url,
            filename
        };
    }

    @Get(':hash')
    async getEvidence(@Param('hash') hash: string, @Res() res: Response) {
        const filePath = await this.evidenceService.getFile(hash);
        if (!filePath) {
            throw new NotFoundException('Evidence not found');
        }
        res.sendFile(filePath);
    }
}
