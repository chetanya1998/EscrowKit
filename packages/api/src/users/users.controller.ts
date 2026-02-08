import { Controller, Get, Param, Query } from '@nestjs/common';
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
}
