import { IsString, IsOptional, IsEmail, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateDoctorDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    specialization: string;

    @IsString()
    @IsOptional()
    licenseNumber?: string;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    qualification?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    experienceYears?: number;

    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;

    @IsString()
    @IsOptional()
    userId?: string;
}
