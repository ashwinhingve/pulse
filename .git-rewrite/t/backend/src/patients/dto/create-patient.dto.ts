import { IsString, IsEnum, IsOptional, IsEmail, IsDateString } from 'class-validator';
import { Gender } from '../entities/patient.entity';

export class CreatePatientDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsDateString()
    @IsOptional()
    dateOfBirth?: string;

    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;

    @IsString()
    @IsOptional()
    bloodGroup?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    emergencyContact?: string;

    @IsString()
    @IsOptional()
    medicalHistory?: string;

    @IsString()
    @IsOptional()
    allergies?: string;
}
