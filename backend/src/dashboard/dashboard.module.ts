import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Report } from '../reports/entities/report.entity';
import { Diagnosis } from '../diagnoses/entities/diagnosis.entity';
import { MedicalCase } from '../medical/entities/medical-case.entity';
import { Symptom } from '../symptoms/entities/symptom.entity';
import { User } from '../users/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Patient, Doctor, Report, Diagnosis,
            MedicalCase, Symptom, User,
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
