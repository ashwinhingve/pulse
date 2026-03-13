import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { MedicalDocument } from './entities/medical-document.entity';
import { DocumentsService } from './documents.service';
import { DocumentAnalysisService } from './document-analysis.service';
import { DocumentsController } from './documents.controller';
import { MedGemmaService } from '../ai/medgemma.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([MedicalDocument]),
        ConfigModule,
    ],
    providers: [DocumentsService, DocumentAnalysisService, MedGemmaService],
    controllers: [DocumentsController],
    exports: [DocumentsService],
})
export class DocumentsModule {}
