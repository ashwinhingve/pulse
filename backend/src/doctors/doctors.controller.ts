import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorsController {
    constructor(private readonly doctorsService: DoctorsService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createDto: CreateDoctorDto) {
        return this.doctorsService.create(createDto);
    }

    @Get()
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    findAll() {
        return this.doctorsService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    findOne(@Param('id') id: string) {
        return this.doctorsService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateDto: UpdateDoctorDto) {
        return this.doctorsService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.doctorsService.remove(id);
    }
}
