import { Controller, Post, UseGuards } from '@nestjs/common';
import { DemoService } from './demo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@Controller('demo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DemoController {
    constructor(private readonly demoService: DemoService) { }

    @Post('seed')
    @Roles(UserRole.ADMIN)
    async seedData() {
        await this.demoService.seedDemoData();
        return { message: 'Demo data seeded successfully' };
    }

    @Post('reset')
    @Roles(UserRole.ADMIN)
    async resetData() {
        await this.demoService.resetDemoData();
        return { message: 'Demo data reset successfully' };
    }
}
