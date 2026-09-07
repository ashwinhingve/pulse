import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,
} from '@nestjs/common';
import { SymptomsService } from './symptoms.service';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/roles.enum';

@Controller('symptoms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SymptomsController {
    constructor(private readonly symptomsService: SymptomsService) { }

    @Post()
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    create(@Body() createDto: CreateSymptomDto, @CurrentUser() user: any) {
        return this.symptomsService.create(createDto, user.id);
    }

    @Get()
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    findAll() {
        return this.symptomsService.findAll();
    }

    @Get('patient/:patientId')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    findByPatient(@Param('patientId') patientId: string) {
        return this.symptomsService.findByPatient(patientId);
    }

    @Get(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    findOne(@Param('id') id: string) {
        return this.symptomsService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateDto: UpdateSymptomDto) {
        return this.symptomsService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.symptomsService.remove(id);
    }
}
