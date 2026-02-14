
import { Controller, Post, Get, Body, Param, Patch } from '@nestjs/common';
import { MilestoneDraftsService } from './milestone-drafts.service';

@Controller('api/v1/drafts')
export class MilestoneDraftsController {
    constructor(private draftsService: MilestoneDraftsService) { }

    @Post()
    createDraft(@Body() body: any) {
        return this.draftsService.createDraft({
            escrowAddress: body.escrowAddress,
            title: body.title,
            description: body.description,
            amount: body.amount,
            deadline: new Date(body.deadline),
            creator: body.creator,
            index: body.index // Optional
        });
    }

    @Get(':escrowAddress')
    getDrafts(@Param('escrowAddress') escrowAddress: string) {
        return this.draftsService.getDrafts(escrowAddress);
    }

    @Post(':id/sign')
    signDraft(@Param('id') id: string, @Body() body: { signature: string, signer: string }) {
        return this.draftsService.signDraft(id, body.signature, body.signer);
    }

    @Patch(':id/reject')
    rejectDraft(@Param('id') id: string) {
        return this.draftsService.rejectDraft(id);
    }
}
