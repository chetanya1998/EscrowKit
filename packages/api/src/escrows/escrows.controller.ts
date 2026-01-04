import { Controller, Get, Param, Query } from '@nestjs/common';
import { EscrowsService } from './escrows.service';

@Controller('escrows')
export class EscrowsController {
    constructor(private readonly escrowsService: EscrowsService) { }

    @Get()
    findAll(@Query('party') party?: string) {
        return this.escrowsService.findAll(party);
    }

    @Get(':address')
    findOne(@Param('address') address: string) {
        return this.escrowsService.findOne(address);
    }

    @Get(':address/milestones')
    getMilestones(@Param('address') address: string) {
        return this.escrowsService.getMilestones(address);
    }

    @Get(':address/events')
    getEvents(@Param('address') address: string) {
        return this.escrowsService.getEvents(address);
    }

    @Get(':address/disputes')
    getDisputes(@Param('address') address: string) {
        return this.escrowsService.getDisputes(address);
    }
}
