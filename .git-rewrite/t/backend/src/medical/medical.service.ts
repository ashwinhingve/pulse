import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { MedicalCase, CaseStatus } from './entities/medical-case.entity';
import { CreateMedicalCaseDto } from './dto/create-medical-case.dto';
import { UpdateMedicalCaseDto } from './dto/update-medical-case.dto';

@Injectable()
export class MedicalService {
    constructor(
        @InjectRepository(MedicalCase)
        private medicalCaseRepository: Repository<MedicalCase>,
    ) { }

    async create(createDto: CreateMedicalCaseDto, userId: string): Promise<MedicalCase> {
        const medicalCase = this.medicalCaseRepository.create({
            ...createDto,
            createdBy: userId,
        });

        return this.medicalCaseRepository.save(medicalCase);
    }

    async findAll(userClearance: number): Promise<MedicalCase[]> {
        // Only return cases user has clearance to view
        return this.medicalCaseRepository
            .createQueryBuilder('case')
            .where('case.deletedAt IS NULL')
            .andWhere('case.clearanceRequired <= :clearance', { clearance: userClearance })
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

        Object.assign(medicalCase, updateDto);
        return this.medicalCaseRepository.save(medicalCase);
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
