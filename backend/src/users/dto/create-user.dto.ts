import {
    IsString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    MinLength,
    IsOptional,
    IsObject,
} from 'class-validator';
import { UserRole, ClearanceLevel } from '../../common/enums/roles.enum';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsString()
    @IsOptional()
    fullName?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsInt()
    @IsOptional()
    clearanceLevel?: ClearanceLevel;

    @IsString()
    @IsOptional()
    department?: string;

    @IsObject()
    @IsOptional()
    metadata?: {
        rank?: string;
        serviceNumber?: string;
        title?: string;
        licenseNumber?: string;
        specialization?: string;
        unit?: string;
    };
}
