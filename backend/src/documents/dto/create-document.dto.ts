import { IsEnum, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { DocumentType } from '../entities/medical-document.entity';

export class CreateDocumentDto {
    @IsEnum(DocumentType)
    documentType: DocumentType;

    @IsOptional()
    @IsString()
    patientId?: string;

    @IsOptional()
    @IsString()
    caseId?: string;

    @IsOptional()
    @IsDateString()
    reportDate?: string;

    @IsOptional()
    @IsString()
    hospitalName?: string;

    @IsOptional()
    @IsString()
    doctorName?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    analyzeAfterUpload?: boolean;
}
