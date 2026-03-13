import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AnonymizationService } from './anonymization.service';
import { BioMistralService } from './biomistral.service';
import { MedicalGuidelinesService } from './guidelines/medical-guidelines.service';
import { AiController } from './ai.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [AuditModule],
    providers: [AiService, AnonymizationService, BioMistralService, MedicalGuidelinesService],
    controllers: [AiController],
    exports: [AiService],
})
export class AiModule {}
