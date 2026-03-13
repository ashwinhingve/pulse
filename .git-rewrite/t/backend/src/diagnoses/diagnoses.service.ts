import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Diagnosis } from './entities/diagnosis.entity';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';

@Injectable()
export class DiagnosesService {
    constructor(
        @InjectRepository(Diagnosis)
        private diagnosisRepository: Repository<Diagnosis>,
    ) { }

    async create(createDto: CreateDiagnosisDto): Promise<Diagnosis> {
        const diagnosis = this.diagnosisRepository.create(createDto);
        return this.diagnosisRepository.save(diagnosis);
    }

    async findAll(): Promise<Diagnosis[]> {
        return this.diagnosisRepository.find({
            where: { deletedAt: IsNull() },
            relations: ['patient', 'doctor'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByPatient(patientId: string): Promise<Diagnosis[]> {
        return this.diagnosisRepository.find({
            where: { patientId, deletedAt: IsNull() },
            relations: ['doctor'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Diagnosis> {
        const diagnosis = await this.diagnosisRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['patient', 'doctor'],
        });
        if (!diagnosis) {
            throw new NotFoundException('Diagnosis not found');
        }
        return diagnosis;
    }

    async update(id: string, updateDto: UpdateDiagnosisDto): Promise<Diagnosis> {
        const diagnosis = await this.findOne(id);
        Object.assign(diagnosis, updateDto);
        return this.diagnosisRepository.save(diagnosis);
    }

    async remove(id: string): Promise<void> {
        const diagnosis = await this.findOne(id);
        diagnosis.deletedAt = new Date();
        await this.diagnosisRepository.save(diagnosis);
    }
}
