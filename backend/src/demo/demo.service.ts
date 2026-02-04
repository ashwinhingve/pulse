import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { MedicalCase, CaseSeverity, CaseStatus } from '../medical/entities/medical-case.entity';
import { UserRole, ClearanceLevel } from '../common/enums/roles.enum';

@Injectable()
export class DemoService {
    private readonly logger = new Logger(DemoService.name);

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(MedicalCase)
        private caseRepository: Repository<MedicalCase>,
    ) { }

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

        // Create demo medical cases
        await this.createDemoCases();

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
        const armyOfficer = await this.userRepository.findOne({
            where: { username: 'maj.harris' },
        });

        const publicOfficial = await this.userRepository.findOne({
            where: { username: 'dr.williams' },
        });

        if (!armyOfficer || !publicOfficial) return;

        const demoCases = [
            // Military cases (created by Army Medical Officer)
            {
                patientCode: 'MIL-2024-001',
                severity: CaseSeverity.URGENT,
                status: CaseStatus.IN_PROGRESS,
                chiefComplaint: 'Combat-related injury requiring coordination',
                symptoms: 'Multiple shrapnel wounds, field treatment administered',
                vitals: { temp: 98.4, bp: '130/85', hr: 88, rr: 18, spo2: 96 },
                medicalHistory: 'Previously healthy, no allergies',
                assessment: 'Stable for transfer, requires surgical evaluation',
                clearanceRequired: ClearanceLevel.SECRET,
                createdBy: armyOfficer.id,
                isClassified: true,
            },
            {
                patientCode: 'MIL-2024-002',
                severity: CaseSeverity.ROUTINE,
                status: CaseStatus.OPEN,
                chiefComplaint: 'Heat exhaustion during training',
                symptoms: 'Fatigue, mild dehydration, headache',
                vitals: { temp: 99.8, bp: '118/76', hr: 92, rr: 20, spo2: 98 },
                medicalHistory: 'No significant history',
                clearanceRequired: ClearanceLevel.UNCLASSIFIED,
                createdBy: armyOfficer.id,
                isClassified: false,
            },
            // Public health cases (created by Public Medical Official)
            {
                patientCode: 'PUB-2024-001',
                severity: CaseSeverity.ROUTINE,
                status: CaseStatus.OPEN,
                chiefComplaint: 'Mass casualty incident coordination',
                symptoms: 'Multiple civilian injuries from accident',
                medicalHistory: 'Community health emergency',
                clearanceRequired: ClearanceLevel.UNCLASSIFIED,
                createdBy: publicOfficial.id,
                isClassified: false,
            },
            {
                patientCode: 'PUB-2024-002',
                severity: CaseSeverity.CRITICAL,
                status: CaseStatus.IN_PROGRESS,
                chiefComplaint: 'Disease outbreak investigation',
                symptoms: 'Cluster of respiratory illness cases',
                medicalHistory: 'Public health surveillance case',
                clearanceRequired: ClearanceLevel.CONFIDENTIAL,
                createdBy: publicOfficial.id,
                isClassified: false,
            },
        ];

        for (const caseData of demoCases) {
            const medicalCase = this.caseRepository.create(caseData);
            await this.caseRepository.save(medicalCase);
            this.logger.log(`Created demo case: ${caseData.patientCode}`);
        }
    }

    async resetDemoData(): Promise<void> {
        this.logger.log('🔄 Resetting demo data...');

        // Delete all cases
        await this.caseRepository.delete({});

        // Delete all users
        await this.userRepository.delete({});

        // Re-seed
        await this.seedDemoData();

        this.logger.log('✅ Demo data reset complete');
    }
}
