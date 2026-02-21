import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SymptomSeverity } from '../entities/symptom.entity';

export class CreateSymptomDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(SymptomSeverity)
    @IsOptional()
    severity?: SymptomSeverity;

    @IsString()
    @IsOptional()
    bodyArea?: string;

    @IsString()
    @IsOptional()
    duration?: string;

    @IsUUID()
    patientId: string;
}
