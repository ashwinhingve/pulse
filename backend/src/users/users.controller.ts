import { Query } from '@nestjs/common';
import type { ListQuery } from '../common/pagination';
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
    Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ClearanceLevel } from '../common/enums/roles.enum';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';

class ApproveUserDto {
    @IsEnum(UserRole)
    role: UserRole;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(3)
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
    findAll(@Query() query: ListQuery) {
        if (query.page !== undefined || query.limit !== undefined) return this.usersService.findPage(query);
        return this.usersService.findAll();
    }

    @Get('summary')
    @Roles(UserRole.ADMIN)
    summary() { return this.usersService.summary(); }

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
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
        return this.usersService.update(id, updateUserDto, req.user.id);
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
    remove(@Param('id') id: string, @Request() req: any) {
        return this.usersService.remove(id, req.user.id);
    }
}
