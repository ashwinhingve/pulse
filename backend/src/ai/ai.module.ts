import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AnonymizationService } from './anonymization.service';
import { AiController } from './ai.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [AuditModule],
    providers: [AiService, AnonymizationService],
    controllers: [AiController],
    exports: [AiService],
})
export class AiModule { }
