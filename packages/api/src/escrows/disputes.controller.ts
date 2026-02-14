
import { Controller, Post, Body, Param } from '@nestjs/common';
import { DisputesService } from './disputes.service';

@Controller('api/v1/disputes')
export class DisputesController {
    constructor(private disputesService: DisputesService) { }

    @Post('evidence')
    getEvidenceCalldata(@Body() body: { adapterAddress: string, disputeId: number, evidence: string }) {
        return this.disputesService.getEvidenceCalldata(body.adapterAddress, body.disputeId, body.evidence);
    }

    @Post('webhook/ruling')
    async receiveRuling(@Body() body: { disputeId: number, ruling: number, escrowAddress: string }) {
        // This receives the judgement from the "Arbitration Connector"
        return this.disputesService.processRuling(body.disputeId, body.ruling, body.escrowAddress);
    }
}
