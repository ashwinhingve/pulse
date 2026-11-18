import { IsString, IsEnum, IsOptional, IsObject, IsNumber, IsUUID, IsInt, Min, Max } from 'class-validator';
import { CaseSeverity } from '../entities/medical-case.entity';

export class CreateMedicalCaseDto {
    @IsUUID()
    @IsOptional()
    patientId?: string | null;
    @IsString()
    patientCode: string; // Anonymized code, NOT real identity

    @IsEnum(CaseSeverity)
    @IsOptional()
    severity?: CaseSeverity;

    @IsString()
    chiefComplaint: string;

    @IsString()
    symptoms: string;

    @IsObject()
    @IsOptional()
    vitals?: Record<string, any>;

    @IsString()
    @IsOptional()
    medicalHistory?: string;

    @IsString()
    @IsOptional()
    assessment?: string;

    @IsString()
    @IsOptional()
    plan?: string;

    @IsInt()
    @Min(0)
    @Max(3)
    @IsOptional()
    clearanceRequired?: number;
}
