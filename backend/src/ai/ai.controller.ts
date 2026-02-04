import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClearanceGuard } from '../auth/guards/clearance.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireClearance } from '../auth/decorators/clearance.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, ClearanceLevel } from '../common/enums/roles.enum';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard, ClearanceGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('analyze-symptoms')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    @RequireClearance(ClearanceLevel.CONFIDENTIAL)
    async analyzeSymptoms(
        @Body() data: {
            symptoms: string;
            vitals?: Record<string, any>;
            medicalHistory?: string;
        },
        @CurrentUser() user: any,
    ) {
        return this.aiService.analyzeSymptoms(data);
    }

    @Post('query-protocol')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    @RequireClearance(ClearanceLevel.UNCLASSIFIED)
    async queryProtocol(
        @Body() data: { query: string },
        @CurrentUser() user: any,
    ) {
        return this.aiService.queryProtocol(data.query);
    }
}
