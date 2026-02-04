import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

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
