import { Controller, Post, UseGuards, Get } from '@nestjs/common';
import { DemoService } from './demo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { Public } from '../auth/decorators/public.decorator';

@Controller('demo')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DemoController {
    constructor(private readonly demoService: DemoService) { }

    // Admin-only: seeds initial demo data
    @Post('seed')
    async seedData() {
        await this.demoService.seedDemoData();
        return { message: 'Demo data seeded successfully' };
    }

    // Admin-only: resets demo data
    @Post('reset')
    async resetData() {
        await this.demoService.resetDemoData();
        return { message: 'Demo data reset successfully' };
    }

    // Public health check endpoint
    @Get('health')
    @Public()
    async health() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
