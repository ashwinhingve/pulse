import { IsString, IsEnum, IsOptional, IsObject, IsNumber, Min, Max } from 'class-validator';
import { CaseSeverity } from '../entities/medical-case.entity';

export class CreateMedicalCaseDto {
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

    @IsNumber()
    @Min(0)
    @Max(2)
    @IsOptional()
    clearanceRequired?: number;
}
