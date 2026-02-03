import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AnonymizerService } from './anonymizer.service';
import { AiController } from './ai.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [AuditModule],
    providers: [AiService, AnonymizerService],
    controllers: [AiController],
    exports: [AiService],
})
export class AiModule { }
