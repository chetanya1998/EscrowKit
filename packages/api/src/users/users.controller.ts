import { Controller, Get, Param, Query, Post, Delete, Body, Patch } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get(':address/escrows')
    getEscrows(
        @Param('address') address: string,
        @Query('role') role?: string,
        @Query('status') status?: string,
    ) {
        return this.usersService.getEscrows(address, role, status);
    }

    @Get(':address/stats')
    getStats(@Param('address') address: string) {
        return this.usersService.getStats(address);
    }

    @Get(':address')
    getProfile(@Param('address') address: string) {
        return this.usersService.getProfile(address);
    }

    @Patch(':address')
    updateProfile(
        @Param('address') address: string,
        @Body() body: any,
    ) {
        return this.usersService.updateProfile(address, body);
    }

    @Post(':address/keys')
    generateApiKey(
        @Param('address') address: string,
        @Body() body: { name: string }
    ) {
        return this.usersService.generateApiKey(address, body.name);
    }

    @Get(':address/keys')
    listApiKeys(@Param('address') address: string) {
        return this.usersService.listApiKeys(address);
    }

    @Delete(':address/keys/:keyId')
    revokeApiKey(
        @Param('address') address: string,
        @Param('keyId') keyId: string
    ) {
        return this.usersService.revokeApiKey(address, keyId);
    }

    @Get(':address/analytics')
    getDetailedStats(@Param('address') address: string) {
        return this.usersService.getDetailedStats(address);
    }
}
