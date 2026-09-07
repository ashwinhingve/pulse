import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { UserStatus } from '../common/enums/roles.enum';
import { MedicalCase, CaseSeverity, CaseStatus } from '../medical/entities/medical-case.entity';
import { UserRole, ClearanceLevel } from '../common/enums/roles.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { Patient, Gender } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Diagnosis, DiagnosisStatus } from '../diagnoses/entities/diagnosis.entity';
import { Report, ReportType } from '../reports/entities/report.entity';
import { Symptom } from '../symptoms/entities/symptom.entity';

@Injectable()
export class DemoService implements OnApplicationBootstrap {
    private readonly logger = new Logger(DemoService.name);

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(MedicalCase)
        private caseRepository: Repository<MedicalCase>,
        @InjectRepository(Patient)
        private patientRepository: Repository<Patient>,
        @InjectRepository(Doctor)
        private doctorRepository: Repository<Doctor>,
        @InjectRepository(Diagnosis)
        private diagnosisRepository: Repository<Diagnosis>,
        @InjectRepository(Report)
        private reportRepository: Repository<Report>,
        @InjectRepository(Symptom)
        private symptomRepository: Repository<Symptom>,
        private dataSource: DataSource,
        private notificationsService: NotificationsService,
    ) { }

    // Auto-seed on startup when the database is empty (first deployment)
    async onApplicationBootstrap(): Promise<void> {
        try {
            const userCount = await this.userRepository.count();
            if (userCount === 0) {
                this.logger.log('📦 Empty database detected — auto-seeding initial data...');
                await this.seedDemoData();
            } else {
                // Schema migration guard: when the 'status' column was added with default 'pending',
                // all pre-existing rows (demo/admin users) got status='pending'.
                // Fix them: any pending user without a requestedRole in metadata is a
                // seeded/admin-created user that should be active.
                const fixed = await this.userRepository
                    .createQueryBuilder()
                    .update(User)
                    .set({ status: UserStatus.ACTIVE, isActive: true })
                    .where('status = :status', { status: UserStatus.PENDING })
                    .andWhere("(metadata->>'requestedRole' IS NULL)")
                    .execute();
                if (fixed.affected && fixed.affected > 0) {
                    this.logger.log(`🔧 Fixed ${fixed.affected} user(s) incorrectly set to pending by schema migration`);
                }
            }
        } catch (err) {
            this.logger.warn(`Auto-seed/fix skipped: ${err.message}`);
        }
    }

    async seedDemoData(): Promise<void> {
        this.logger.log('🌱 Seeding demo data...');

        // Check if demo data already exists
        const existingUsers = await this.userRepository.count();
        if (existingUsers > 0) {
            this.logger.log('Demo data already exists, skipping seed');
            return;
        }

        // Create demo users
        await this.createDemoUsers();

        // Create demo doctors
        await this.createDemoDoctors();

        // Create demo patients
        await this.createDemoPatients();

        // Create demo medical cases (expanded)
        await this.createDemoCases();

        // Create demo diagnoses and reports
        await this.createDemoDiagnoses();
        await this.createDemoReports();

        // Seed demo notifications
        await this.seedNotifications();

        this.logger.log('✅ Demo data seeded successfully');
    }

    private async createDemoUsers(): Promise<void> {
        const demoUsers = [
            // Army Medical Officers
            {
                username: 'maj.harris',
                password: 'Demo123!',
                fullName: 'Major Sarah Harris',
                role: UserRole.ARMY_MEDICAL_OFFICER,
                clearanceLevel: ClearanceLevel.SECRET,
                department: 'Field Medical Unit Alpha',
                rank: 'Major',
                serviceNumber: 'AMO-2024-001',
            },
            {
                username: 'cpt.rodriguez',
                password: 'Demo123!',
                fullName: 'Captain Miguel Rodriguez',
                role: UserRole.ARMY_MEDICAL_OFFICER,
                clearanceLevel: ClearanceLevel.SECRET,
                department: 'Combat Support Hospital',
                rank: 'Captain',
                serviceNumber: 'AMO-2024-002',
            },
            {
                username: 'lt.chen',
                password: 'Demo123!',
                fullName: 'Lieutenant James Chen',
                role: UserRole.ARMY_MEDICAL_OFFICER,
                clearanceLevel: ClearanceLevel.CONFIDENTIAL,
                department: 'Medical Battalion HQ',
                rank: 'Lieutenant',
                serviceNumber: 'AMO-2024-003',
            },
            // Public Medical Officials
            {
                username: 'dr.williams',
                password: 'Demo123!',
                fullName: 'Dr. Emily Williams',
                role: UserRole.PUBLIC_MEDICAL_OFFICIAL,
                clearanceLevel: ClearanceLevel.CONFIDENTIAL,
                department: 'Regional Health Authority',
                title: 'Chief Medical Officer',
                licenseNumber: 'PMO-2024-001',
            },
            {
                username: 'dr.patel',
                password: 'Demo123!',
                fullName: 'Dr. Arun Patel',
                role: UserRole.PUBLIC_MEDICAL_OFFICIAL,
                clearanceLevel: ClearanceLevel.CONFIDENTIAL,
                department: 'Emergency Medical Services',
                title: 'Emergency Medicine Director',
                licenseNumber: 'PMO-2024-002',
            },
            {
                username: 'dr.johnson',
                password: 'Demo123!',
                fullName: 'Dr. Michelle Johnson',
                role: UserRole.PUBLIC_MEDICAL_OFFICIAL,
                clearanceLevel: ClearanceLevel.UNCLASSIFIED,
                department: 'Public Health Department',
                title: 'Epidemiologist',
                licenseNumber: 'PMO-2024-003',
            },
            // Admin
            {
                username: 'admin',
                password: 'Demo123!',
                fullName: 'System Administrator',
                role: UserRole.ADMIN,
                clearanceLevel: ClearanceLevel.TOP_SECRET,
                department: 'IT Administration',
            },
        ];

        for (const userData of demoUsers) {
            const passwordHash = await bcrypt.hash(userData.password, 12);
            const user = this.userRepository.create({
                username: userData.username,
                passwordHash,
                fullName: userData.fullName,
                role: userData.role,
                clearanceLevel: userData.clearanceLevel,
                department: userData.department,
                status: UserStatus.ACTIVE,
                isActive: true,
                metadata: {
                    rank: userData.rank,
                    serviceNumber: userData.serviceNumber,
                    title: userData.title,
                    licenseNumber: userData.licenseNumber,
                },
            });
            await this.userRepository.save(user);
            this.logger.log(`Created demo user: ${userData.username} (${userData.role})`);
        }
    }

    private async createDemoCases(): Promise<void> {
        const armyOfficer = await this.userRepository.findOne({ where: { username: 'maj.harris' } });
        const publicOfficial = await this.userRepository.findOne({ where: { username: 'dr.williams' } });
        if (!armyOfficer || !publicOfficial) return;

        const demoCases = [
            {
                patientCode: 'MIL-2024-001', severity: CaseSeverity.URGENT, status: CaseStatus.IN_PROGRESS,
                chiefComplaint: 'Combat-related injury requiring coordination',
                symptoms: 'Multiple shrapnel wounds, field treatment administered',
                vitals: { temp: 98.4, bp: '130/85', hr: 88, rr: 18, spo2: 96 },
                medicalHistory: 'Previously healthy, no allergies', assessment: 'Stable for transfer, requires surgical evaluation',
                clearanceRequired: ClearanceLevel.SECRET, createdBy: armyOfficer.id, isClassified: true,
                createdAt: new Date(),
            },
            {
                patientCode: 'MIL-2024-002', severity: CaseSeverity.ROUTINE, status: CaseStatus.OPEN,
                chiefComplaint: 'Heat exhaustion during training',
                symptoms: 'Fatigue, mild dehydration, headache',
                vitals: { temp: 99.8, bp: '118/76', hr: 92, rr: 20, spo2: 98 },
                medicalHistory: 'No significant history',
                clearanceRequired: ClearanceLevel.UNCLASSIFIED, createdBy: armyOfficer.id, isClassified: false,
                createdAt: new Date(),
            },
            {
                patientCode: 'PUB-2024-001', severity: CaseSeverity.ROUTINE, status: CaseStatus.RESOLVED,
                chiefComplaint: 'Mass casualty incident coordination',
                symptoms: 'Multiple civilian injuries from accident',
                medicalHistory: 'Community health emergency',
                clearanceRequired: ClearanceLevel.UNCLASSIFIED, createdBy: publicOfficial.id, isClassified: false,
                createdAt: new Date(Date.now() - 30 * 86400000), // 1 month ago
            },
            {
                patientCode: 'PUB-2024-002', severity: CaseSeverity.CRITICAL, status: CaseStatus.IN_PROGRESS,
                chiefComplaint: 'Disease outbreak investigation',
                symptoms: 'Cluster of respiratory illness cases',
                medicalHistory: 'Public health surveillance case',
                clearanceRequired: ClearanceLevel.CONFIDENTIAL, createdBy: publicOfficial.id, isClassified: false,
                createdAt: new Date(),
            },
        ];

        // Generate additional historical cases across last 12 months for volume charts
        const severities = [CaseSeverity.ROUTINE, CaseSeverity.URGENT, CaseSeverity.CRITICAL];
        const statuses = [CaseStatus.RESOLVED, CaseStatus.RESOLVED, CaseStatus.IN_PROGRESS];
        
        for (let i = 1; i <= 24; i++) {
            const randomMonthOffset = Math.floor(Math.random() * 12);
            const randomDaysOffset = Math.floor(Math.random() * 28);
            const createdDate = new Date();
            createdDate.setMonth(createdDate.getMonth() - randomMonthOffset);
            createdDate.setDate(createdDate.getDate() - randomDaysOffset);
            
            demoCases.push({
                patientCode: `HIST-2023-${i.toString().padStart(3, '0')}`,
                severity: severities[Math.floor(Math.random() * severities.length)],
                status: randomMonthOffset > 1 ? CaseStatus.RESOLVED : statuses[Math.floor(Math.random() * statuses.length)],
                chiefComplaint: `Historical case sample ${i}`,
                symptoms: 'Standard symptoms recorded',
                vitals: {},
                medicalHistory: 'N/A',
                assessment: 'Archived',
                clearanceRequired: ClearanceLevel.UNCLASSIFIED,
                createdBy: publicOfficial.id,
                isClassified: false,
                createdAt: createdDate,
            } as any);
        }

        for (const caseData of demoCases) {
            const medicalCase = this.caseRepository.create(caseData);
            await this.caseRepository.save(medicalCase);
            this.logger.log(`Created demo case: ${caseData.patientCode}`);
        }
    }

    async resetDemoData(): Promise<void> {
        this.logger.log('🔄 Resetting demo data...');

        // TRUNCATE with CASCADE drops all rows from user and every table that
        // has a FK pointing at it (message, conversation, medical_case,
        // medical_file, audit_log, etc.) in one atomic operation.
        await this.dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');

        // Re-seed directly (bypass the "already exists" guard in seedDemoData)
        await this.createDemoUsers();
        await this.createDemoDoctors();
        await this.createDemoPatients();
        await this.createDemoCases();
        await this.createDemoDiagnoses();
        await this.createDemoReports();
        await this.seedNotifications();

        this.logger.log('✅ Demo data reset complete');
    }

    private async seedNotifications(): Promise<void> {
        const users = await this.userRepository.find({
            select: ['id', 'username'],
        });
        const userIds: Record<string, string> = {};
        for (const u of users) {
            userIds[u.username] = u.id;
        }
        await this.notificationsService.seedDemoNotifications(userIds);
        this.logger.log('📬 Demo notifications seeded');
    }

    private async createDemoDoctors(): Promise<void> {
        const armyOfficer = await this.userRepository.findOne({ where: { username: 'maj.harris' } });
        const publicOfficial = await this.userRepository.findOne({ where: { username: 'dr.williams' } });

        const demoDoctors = [
            {
                firstName: 'Sarah',
                lastName: 'Harris',
                specialization: 'Trauma Surgery',
                department: 'Field Medical Unit Alpha',
                experienceYears: 12,
                userId: armyOfficer?.id,
            },
            {
                firstName: 'Emily',
                lastName: 'Williams',
                specialization: 'Epidemiology',
                department: 'Regional Health Authority',
                experienceYears: 15,
                userId: publicOfficial?.id,
            }
        ];

        for (const docData of demoDoctors) {
            const doctor = this.doctorRepository.create(docData);
            await this.doctorRepository.save(doctor);
            this.logger.log(`Created demo doctor: ${docData.firstName} ${docData.lastName}`);
        }
    }

    private async createDemoPatients(): Promise<void> {
        const admin = await this.userRepository.findOne({ where: { username: 'admin' } });
        
        const demoPatients = [
            {
                firstName: 'John', lastName: 'Doe', gender: Gender.MALE, bloodGroup: 'O+',
                phone: '555-0101', email: 'john.doe@example.com',
                medicalHistory: 'Hypertension', allergies: 'Penicillin',
                createdBy: admin?.id || 'system',
            },
            {
                firstName: 'Jane', lastName: 'Smith', gender: Gender.FEMALE, bloodGroup: 'A-',
                phone: '555-0102', email: 'jane.smith@example.com',
                medicalHistory: 'Asthma', allergies: 'None',
                createdBy: admin?.id || 'system',
            },
            {
                firstName: 'Michael', lastName: 'Johnson', gender: Gender.MALE, bloodGroup: 'B+',
                phone: '555-0103', email: 'michael.j@example.com',
                medicalHistory: 'Type 2 Diabetes', allergies: 'Sulfa Drugs',
                createdBy: admin?.id || 'system',
            }
        ];

        for (const patData of demoPatients) {
            const patient = this.patientRepository.create(patData);
            await this.patientRepository.save(patient);
            this.logger.log(`Created demo patient: ${patData.firstName} ${patData.lastName}`);
        }
    }

    private async createDemoDiagnoses(): Promise<void> {
        const patients = await this.patientRepository.find();
        const doctors = await this.doctorRepository.find();
        
        if (patients.length === 0 || doctors.length === 0) return;

        const demoDiagnoses = [
            {
                diseaseName: 'Acute Bronchitis',
                description: 'Inflammation of the bronchial tubes',
                icdCode: 'J20.9',
                status: DiagnosisStatus.CONFIRMED,
                patientId: patients[0].id,
                doctorId: doctors[0].id,
                diagnosedAt: new Date(Date.now() - 15 * 86400000), // 15 days ago
            },
            {
                diseaseName: 'Essential Hypertension',
                description: 'High blood pressure',
                icdCode: 'I10',
                status: DiagnosisStatus.PRELIMINARY,
                patientId: patients[1].id,
                doctorId: doctors[1]?.id || doctors[0].id,
                diagnosedAt: new Date(Date.now() - 5 * 86400000), // 5 days ago
            }
        ];

        for (const diagData of demoDiagnoses) {
            const diagnosis = this.diagnosisRepository.create(diagData);
            await this.diagnosisRepository.save(diagnosis);
            this.logger.log(`Created demo diagnosis: ${diagData.diseaseName}`);
        }
    }

    private async createDemoReports(): Promise<void> {
        const patients = await this.patientRepository.find();
        const doctors = await this.doctorRepository.find();
        const diagnoses = await this.diagnosisRepository.find();

        if (patients.length === 0 || doctors.length === 0) return;

        const demoReports = [
            {
                title: 'Comprehensive Metabolic Panel',
                type: ReportType.LAB,
                findings: 'Slightly elevated glucose levels, otherwise normal.',
                recommendations: 'Follow up in 3 months with A1C test.',
                patientId: patients[0].id,
                doctorId: doctors[0].id,
                diagnosisId: diagnoses[0]?.id,
            },
            {
                title: 'Chest X-Ray',
                type: ReportType.IMAGING,
                findings: 'Clear lungs, no infiltrates or effusions.',
                recommendations: 'No further action required.',
                patientId: patients[1].id,
                doctorId: doctors[1]?.id || doctors[0].id,
                diagnosisId: diagnoses[1]?.id,
            }
        ];

        for (const repData of demoReports) {
            const report = this.reportRepository.create(repData);
            await this.reportRepository.save(report);
            this.logger.log(`Created demo report: ${repData.title}`);
        }
    }
}
