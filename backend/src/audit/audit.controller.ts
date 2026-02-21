import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
    constructor(private readonly auditService: AuditService) {}

    @Get('logs')
    findAll(
        @Query('limit') limit: number = 100,
        @Query('offset') offset: number = 0,
    ) {
        return this.auditService.findAll(Number(limit), Number(offset));
    }

    @Get('logs/user/:userId')
    findByUser(
        @Param('userId') userId: string,
        @Query('limit') limit: number = 50,
    ) {
        return this.auditService.findByUser(userId, Number(limit));
    }

    @Get('verify')
    async verify() {
        const intact = await this.auditService.verifyIntegrity();
        return { intact };
    }
}
