import { IsString, IsEnum, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ReportType } from '../entities/report.entity';

export class CreateReportDto {
    @IsString()
    title: string;

    @IsEnum(ReportType)
    @IsOptional()
    type?: ReportType;

    @IsString()
    @IsOptional()
    findings?: string;

    @IsString()
    @IsOptional()
    recommendations?: string;

    @IsUUID()
    patientId: string;

    @IsUUID()
    doctorId: string;

    @IsUUID()
    @IsOptional()
    diagnosisId?: string;

    @IsArray()
    @IsOptional()
    attachments?: string[];
}
