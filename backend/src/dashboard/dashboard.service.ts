import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Report } from '../reports/entities/report.entity';
import { Diagnosis } from '../diagnoses/entities/diagnosis.entity';
import { MedicalCase, CaseStatus } from '../medical/entities/medical-case.entity';
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

        const [recentActivity, monthlyCaseVolume, caseCompletionRate] = await Promise.all([
            this.getRecentActivity(),
            this.getMonthlyCaseVolume(),
            this.getCaseCompletionRate(),
        ]);

        return {
            patients,
            doctors,
            reports,
            diagnoses,
            cases,
            symptoms,
            users,
            recentActivity,
            charts: {
                monthlyCaseVolume,
                caseCompletionRate,
            },
        };
    }

    /** Returns case counts per month for the last 12 months */
    private async getMonthlyCaseVolume(): Promise<{ month: string; cases: number }[]> {
        const months: { month: string; cases: number }[] = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const label = d.toLocaleString('en-US', { month: 'short' });

            try {
                const count = await this.caseRepo
                    .createQueryBuilder('c')
                    .where('c.createdAt >= :start AND c.createdAt < :end', {
                        start: d.toISOString(),
                        end: nextD.toISOString(),
                    })
                    .getCount();
                months.push({ month: label, cases: count });
            } catch {
                months.push({ month: label, cases: 0 });
            }
        }

        return months;
    }

    /** Returns percentage of closed vs total cases */
    private async getCaseCompletionRate(): Promise<{
        closed: number;
        open: number;
        inProgress: number;
        total: number;
        completionPct: number;
    }> {
        try {
            const total = await this.caseRepo.count();
            if (total === 0) {
                return { closed: 0, open: 0, inProgress: 0, total: 0, completionPct: 0 };
            }

            const closed = await this.caseRepo.count({ where: { status: CaseStatus.RESOLVED } });
            const inProgress = await this.caseRepo.count({ where: { status: CaseStatus.IN_PROGRESS } });
            const open = total - closed - inProgress;

            return {
                closed,
                open: Math.max(0, open),
                inProgress,
                total,
                completionPct: Math.round((closed / total) * 100),
            };
        } catch {
            return { closed: 0, open: 0, inProgress: 0, total: 0, completionPct: 0 };
        }
    }

    private async getRecentActivity() {
        const activities: { action: string; time: string; type: string }[] = [];

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

        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        return activities.slice(0, 5);
    }
}
