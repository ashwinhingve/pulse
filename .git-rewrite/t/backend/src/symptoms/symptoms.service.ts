import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Symptom } from './entities/symptom.entity';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';

@Injectable()
export class SymptomsService {
    constructor(
        @InjectRepository(Symptom)
        private symptomRepository: Repository<Symptom>,
    ) { }

    async create(createDto: CreateSymptomDto, userId: string): Promise<Symptom> {
        const symptom = this.symptomRepository.create({
            ...createDto,
            reportedBy: userId,
        });
        return this.symptomRepository.save(symptom);
    }

    async findAll(): Promise<Symptom[]> {
        return this.symptomRepository.find({
            where: { deletedAt: IsNull() },
            relations: ['patient'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByPatient(patientId: string): Promise<Symptom[]> {
        return this.symptomRepository.find({
            where: { patientId, deletedAt: IsNull() },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Symptom> {
        const symptom = await this.symptomRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['patient'],
        });
        if (!symptom) {
            throw new NotFoundException('Symptom not found');
        }
        return symptom;
    }

    async update(id: string, updateDto: UpdateSymptomDto): Promise<Symptom> {
        const symptom = await this.findOne(id);
        Object.assign(symptom, updateDto);
        return this.symptomRepository.save(symptom);
    }

    async remove(id: string): Promise<void> {
        const symptom = await this.findOne(id);
        symptom.deletedAt = new Date();
        await this.symptomRepository.save(symptom);
    }
}
