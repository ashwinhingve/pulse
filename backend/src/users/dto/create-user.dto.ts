import {
    IsString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    MinLength,
    IsOptional,
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

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsInt()
    @IsOptional()
    clearanceLevel?: ClearanceLevel;
}
