import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Report } from '../reports/entities/report.entity';
import { Diagnosis } from '../diagnoses/entities/diagnosis.entity';
import { MedicalCase } from '../medical/entities/medical-case.entity';
import { Symptom } from '../symptoms/entities/symptom.entity';
import { User } from '../users/user.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Patient) private patientRepo: Repository<Patient>,
        @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
        @InjectRepository(Report) private reportRepo: Repository<Report>,
        @InjectRepository(Diagnosis) private diagnosisRepo: Repository<Diagnosis>,
        @InjectRepository(MedicalCase) private caseRepo: Repository<MedicalCase>,
        @InjectRepository(Symptom) private symptomRepo: Repository<Symptom>,
        @InjectRepository(User) private userRepo: Repository<User>,
    ) { }

    async getStats() {
        const [patients, doctors, reports, diagnoses, cases, symptoms, users] =
            await Promise.all([
                this.patientRepo.count(),
                this.doctorRepo.count(),
                this.reportRepo.count(),
                this.diagnosisRepo.count(),
                this.caseRepo.count(),
                this.symptomRepo.count(),
                this.userRepo.count(),
            ]);

        // Recent activity: latest 5 entities created across all tables
        const recentActivity = await this.getRecentActivity();

        return {
            patients,
            doctors,
            reports,
            diagnoses,
            cases,
            symptoms,
            users,
            recentActivity,
        };
    }

    private async getRecentActivity() {
        const activities: { action: string; time: string; type: string }[] = [];

        // Get latest patients
        const latestPatients = await this.patientRepo.find({
            order: { createdAt: 'DESC' },
            take: 3,
            select: ['id', 'firstName', 'lastName', 'createdAt'],
        });
        for (const p of latestPatients) {
            activities.push({
                action: `Patient ${p.firstName} ${p.lastName} added`,
                time: p.createdAt?.toISOString() || new Date().toISOString(),
                type: 'patient',
            });
        }

        // Get latest cases
        const latestCases = await this.caseRepo.find({
            order: { createdAt: 'DESC' },
            take: 3,
            select: ['id', 'patientCode', 'chiefComplaint', 'createdAt'],
        });
        for (const c of latestCases) {
            activities.push({
                action: `Case ${c.patientCode || ''} — ${c.chiefComplaint?.slice(0, 40) || 'No complaint'}`,
                time: c.createdAt?.toISOString() || new Date().toISOString(),
                type: 'case',
            });
        }

        // Get latest diagnoses
        const latestDiagnoses = await this.diagnosisRepo.find({
            order: { createdAt: 'DESC' },
            take: 3,
            select: ['id', 'diseaseName', 'createdAt'],
        });
        for (const d of latestDiagnoses) {
            activities.push({
                action: `Diagnosis: ${d.diseaseName}`,
                time: d.createdAt?.toISOString() || new Date().toISOString(),
                type: 'diagnosis',
            });
        }

        // Get latest reports
        const latestReports = await this.reportRepo.find({
            order: { createdAt: 'DESC' },
            take: 3,
            select: ['id', 'title', 'createdAt'],
        });
        for (const r of latestReports) {
            activities.push({
                action: `Report: ${r.title}`,
                time: r.createdAt?.toISOString() || new Date().toISOString(),
                type: 'report',
            });
        }

        // Sort by time descending and return top 5
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        return activities.slice(0, 5);
    }
}
