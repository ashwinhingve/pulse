import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../../common/enums/roles.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsEnum(UserStatus)
    @IsOptional()
    status?: UserStatus;

    @IsBoolean()
    @IsOptional()
    mfaEnabled?: boolean;

    @IsString()
    @IsOptional()
    mfaSecret?: string | null;

    @IsString()
    @IsOptional()
    password?: string;
}
