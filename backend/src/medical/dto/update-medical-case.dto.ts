import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicalCaseDto } from './create-medical-case.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CaseStatus } from '../entities/medical-case.entity';

export class UpdateMedicalCaseDto extends PartialType(CreateMedicalCaseDto) {
    @IsEnum(CaseStatus)
    @IsOptional()
    status?: CaseStatus;

    @IsOptional()
    @IsUUID()
    assignedTo?: string | null;
}
