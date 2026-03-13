import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ClassSerializerInterceptor,
    UseInterceptors,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ClearanceLevel } from '../common/enums/roles.enum';
import { IsEnum, IsOptional } from 'class-validator';

class ApproveUserDto {
    @IsEnum(UserRole)
    role: UserRole;

    @IsOptional()
    clearanceLevel?: ClearanceLevel;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.ARMY_MEDICAL_OFFICER)
    findAll() {
        return this.usersService.findAll();
    }

    @Get('pending')
    @Roles(UserRole.ADMIN)
    findPending() {
        return this.usersService.findPending();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.ARMY_MEDICAL_OFFICER)
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Post(':id/approve')
    @Roles(UserRole.ADMIN)
    approve(@Param('id') id: string, @Body() dto: ApproveUserDto) {
        return this.usersService.approveUser(
            id,
            dto.role,
            dto.clearanceLevel ?? ClearanceLevel.UNCLASSIFIED,
        );
    }

    @Post(':id/reject')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(UserRole.ADMIN)
    reject(@Param('id') id: string) {
        return this.usersService.rejectUser(id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
