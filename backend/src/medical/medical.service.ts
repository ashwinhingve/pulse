import { paginatedList, ListQuery } from '../common/pagination';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { MedicalCase, CaseStatus } from './entities/medical-case.entity';
import { CreateMedicalCaseDto } from './dto/create-medical-case.dto';
import { UpdateMedicalCaseDto } from './dto/update-medical-case.dto';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/user.entity';
import { UserRole, UserStatus } from '../common/enums/roles.enum';

@Injectable()
export class MedicalService {
    constructor(
        @InjectRepository(MedicalCase)
        private medicalCaseRepository: Repository<MedicalCase>,
    ) { }

    async create(createDto: CreateMedicalCaseDto, userId: string, clearance = 0): Promise<MedicalCase> {
        if ((createDto.clearanceRequired ?? 0) > clearance) throw new ForbiddenException('Cannot create a case above your clearance');
        await this.validateReferences(createDto);
        const medicalCase = this.medicalCaseRepository.create({
            ...createDto,
            createdBy: userId,
        });

        return this.medicalCaseRepository.save(medicalCase);
    }

    findPage(query: ListQuery, clearance: number) {
        return paginatedList(this.medicalCaseRepository, query, ['patientCode', 'chiefComplaint'], [], { clearance, patientId: query.patientId });
    }

    async findAll(userClearance: number, patientId?: string): Promise<MedicalCase[]> {
        // Only return cases user has clearance to view
        return this.medicalCaseRepository
            .createQueryBuilder('case')
            .where('case.deletedAt IS NULL')
            .andWhere('case.clearanceRequired <= :clearance', { clearance: userClearance })
            .andWhere('(CAST(:patientId AS text) IS NULL OR CAST(case.patientId AS text) = :patientId)', { patientId: patientId || null })
            .orderBy('case.createdAt', 'DESC')
            .getMany();
    }

    async findOne(id: string, userClearance: number): Promise<MedicalCase> {
        const medicalCase = await this.medicalCaseRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });

        if (!medicalCase) {
            throw new NotFoundException('Medical case not found');
        }

        if (medicalCase.clearanceRequired > userClearance) {
            throw new ForbiddenException('Insufficient clearance level');
        }

        return medicalCase;
    }

    async update(
        id: string,
        updateDto: UpdateMedicalCaseDto,
        userId: string,
        userClearance: number,
    ): Promise<MedicalCase> {
        const medicalCase = await this.findOne(id, userClearance);

        if ((updateDto.clearanceRequired ?? medicalCase.clearanceRequired) > userClearance) {
            throw new ForbiddenException('Cannot set a case above your clearance');
        }
        await this.validateReferences({ ...updateDto, clearanceRequired: updateDto.clearanceRequired ?? medicalCase.clearanceRequired });
        Object.assign(medicalCase, updateDto);
        if (updateDto.status !== undefined) medicalCase.closedAt = updateDto.status === CaseStatus.RESOLVED ? new Date() : null as any;
        return this.medicalCaseRepository.save(medicalCase);
    }

    async getAssignees() {
        return this.medicalCaseRepository.manager.getRepository(User).find({
            where: [UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL].map(role => ({
                role, isActive: true, status: UserStatus.ACTIVE, deletedAt: IsNull(),
            })), select: ['id', 'fullName', 'username', 'role', 'clearanceLevel'], order: { fullName: 'ASC' },
        });
    }

    private async validateReferences(dto: CreateMedicalCaseDto | UpdateMedicalCaseDto) {
        if (dto.patientId) {
            const patient = await this.medicalCaseRepository.manager.getRepository(Patient).findOne({ where: { id: dto.patientId, deletedAt: IsNull() } });
            if (!patient) throw new NotFoundException('Patient not found');
        }
        if ('assignedTo' in dto && dto.assignedTo) {
            const clinician = (await this.getAssignees()).find(user => user.id === dto.assignedTo);
            if (!clinician || clinician.clearanceLevel < (dto.clearanceRequired ?? 0)) throw new ForbiddenException('Assignee must be an active clinician with sufficient clearance');
        }
    }

    async markAiAssisted(id: string, suggestions: any): Promise<void> {
        await this.medicalCaseRepository.update(id, {
            aiAssisted: true,
            aiSuggestions: suggestions,
        });
    }

    async close(id: string, userClearance: number): Promise<void> {
        const medicalCase = await this.findOne(id, userClearance);

        medicalCase.status = CaseStatus.RESOLVED;
        medicalCase.closedAt = new Date();

        await this.medicalCaseRepository.save(medicalCase);
    }

    async remove(id: string, userClearance: number): Promise<void> {
        const medicalCase = await this.findOne(id, userClearance);

        medicalCase.deletedAt = new Date();
        await this.medicalCaseRepository.save(medicalCase);
    }

    /**
     * Get anonymized case data for AI processing
     * CRITICAL: This strips all identity information
     */
    async getAnonymizedCaseForAI(id: string): Promise<any> {
        const medicalCase = await this.medicalCaseRepository.findOne({
            where: { id },
        });

        if (!medicalCase) {
            throw new NotFoundException('Case not found');
        }

        // Return ONLY medical data, NO identity
        return {
            caseId: medicalCase.id, // Keep for reference
            severity: medicalCase.severity,
            chiefComplaint: medicalCase.chiefComplaint,
            symptoms: medicalCase.symptoms,
            vitals: medicalCase.vitals,
            medicalHistory: medicalCase.medicalHistory,
            assessment: medicalCase.assessment,
            // NO patientCode, NO createdBy, NO timestamps
        };
    }
}
