import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,
} from '@nestjs/common';
import { DiagnosesService } from './diagnoses.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@Controller('diagnoses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiagnosesController {
    constructor(private readonly diagnosesService: DiagnosesService) { }

    @Post()
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    create(@Body() createDto: CreateDiagnosisDto) {
        return this.diagnosesService.create(createDto);
    }

    @Get()
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    findAll() {
        return this.diagnosesService.findAll();
    }

    @Get('patient/:patientId')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    findByPatient(@Param('patientId') patientId: string) {
        return this.diagnosesService.findByPatient(patientId);
    }

    @Get(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    findOne(@Param('id') id: string) {
        return this.diagnosesService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateDto: UpdateDiagnosisDto) {
        return this.diagnosesService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.diagnosesService.remove(id);
    }
}
