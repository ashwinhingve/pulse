import { IsString, IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { DiagnosisStatus } from '../entities/diagnosis.entity';

export class CreateDiagnosisDto {
    @IsString()
    diseaseName: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icdCode?: string;

    @IsEnum(DiagnosisStatus)
    @IsOptional()
    status?: DiagnosisStatus;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsUUID()
    patientId: string;

    @IsUUID()
    doctorId: string;

    @IsDateString()
    @IsOptional()
    diagnosedAt?: string;
}
