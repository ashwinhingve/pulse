import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';
import { User } from '../users/user.entity';
import { MedicalCase } from '../medical/entities/medical-case.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Diagnosis } from '../diagnoses/entities/diagnosis.entity';
import { Report } from '../reports/entities/report.entity';
import { Symptom } from '../symptoms/entities/symptom.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User, 
            MedicalCase, 
            Patient, 
            Doctor, 
            Diagnosis, 
            Report, 
            Symptom
        ]),
        NotificationsModule,
    ],
    controllers: [DemoController],
    providers: [DemoService],
    exports: [DemoService],
})
export class DemoModule { }
