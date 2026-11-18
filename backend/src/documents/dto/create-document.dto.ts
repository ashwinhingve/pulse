import { IsEnum, IsOptional, IsString, IsDateString, IsBoolean, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { DocumentType } from '../entities/medical-document.entity';

export class CreateDocumentDto {
    @IsEnum(DocumentType)
    documentType: DocumentType;

    @IsOptional()
    @IsUUID()
    patientId?: string;

    @IsOptional()
    @IsUUID()
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
    @Transform(({ value, obj }) => { const raw = obj.analyzeAfterUpload ?? value; return raw === 'true' || raw === true; })
    @IsBoolean()
    analyzeAfterUpload?: boolean;
}
