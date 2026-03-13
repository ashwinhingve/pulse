import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { MedicalService } from './medical.service';
import { CreateMedicalCaseDto } from './dto/create-medical-case.dto';
import { UpdateMedicalCaseDto } from './dto/update-medical-case.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClearanceGuard } from '../auth/guards/clearance.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireClearance } from '../auth/decorators/clearance.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, ClearanceLevel } from '../common/enums/roles.enum';

@Controller('medical/cases')
@UseGuards(JwtAuthGuard, RolesGuard, ClearanceGuard)
export class MedicalController {
    constructor(private readonly medicalService: MedicalService) { }

    @Post()
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    @RequireClearance(ClearanceLevel.CONFIDENTIAL)
    create(
        @Body() createDto: CreateMedicalCaseDto,
        @CurrentUser() user: any,
    ) {
        return this.medicalService.create(createDto, user.id);
    }

    @Get()
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    @RequireClearance(ClearanceLevel.UNCLASSIFIED)
    findAll(@CurrentUser() user: any) {
        return this.medicalService.findAll(user.clearanceLevel);
    }

    @Get(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    @RequireClearance(ClearanceLevel.UNCLASSIFIED)
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.medicalService.findOne(id, user.clearanceLevel);
    }

    @Patch(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    @RequireClearance(ClearanceLevel.CONFIDENTIAL)
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateMedicalCaseDto,
        @CurrentUser() user: any,
    ) {
        return this.medicalService.update(id, updateDto, user.id, user.clearanceLevel);
    }

    @Post(':id/close')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    @RequireClearance(ClearanceLevel.CONFIDENTIAL)
    close(@Param('id') id: string, @CurrentUser() user: any) {
        return this.medicalService.close(id, user.clearanceLevel);
    }

    @Delete(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.ADMIN)
    @RequireClearance(ClearanceLevel.SECRET)
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.medicalService.remove(id, user.clearanceLevel);
    }
}
