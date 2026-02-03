import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { AiService } from './ai.service';
import { PatientData } from './anonymizer.service';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
    constructor(private aiService: AiService) { }

    @Post('analyze-symptoms')
    @Roles(UserRole.DOCTOR, UserRole.MEDIC, UserRole.PUBLIC)
    @Throttle(20, 3600) // 20 requests per hour
    async analyzeSymptoms(@Request() req, @Body() data: PatientData) {
        return this.aiService.analyzeSymptoms({
            type: 'symptom-analysis',
            data,
            userId: req.user.userId,
            username: req.user.username,
        });
    }

    @Post('analyze-ecg')
    @Roles(UserRole.DOCTOR, UserRole.MEDIC)
    @Throttle(10, 3600) // 10 requests per hour
    async analyzeEcg(@Request() req, @Body() data: any) {
        return this.aiService.analyzeEcg({
            type: 'ecg-analysis',
            data,
            userId: req.user.userId,
            username: req.user.username,
        });
    }

    @Post('query-protocol')
    @Roles(UserRole.DOCTOR, UserRole.MEDIC)
    @Throttle(30, 3600) // 30 requests per hour
    async queryProtocol(@Request() req, @Body('query') query: string) {
        return this.aiService.queryProtocol(query, {
            type: 'protocol-query',
            data: query,
            userId: req.user.userId,
            username: req.user.username,
        });
    }
}
