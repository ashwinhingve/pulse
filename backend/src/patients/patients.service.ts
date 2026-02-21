import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
    constructor(
        @InjectRepository(Patient)
        private patientRepository: Repository<Patient>,
    ) { }

    async create(createDto: CreatePatientDto, userId: string): Promise<Patient> {
        const patient = this.patientRepository.create({
            ...createDto,
            createdBy: userId,
        });
        return this.patientRepository.save(patient);
    }

    async findAll(): Promise<Patient[]> {
        return this.patientRepository.find({
            where: { deletedAt: IsNull() },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Patient> {
        const patient = await this.patientRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!patient) {
            throw new NotFoundException('Patient not found');
        }
        return patient;
    }

    async update(id: string, updateDto: UpdatePatientDto): Promise<Patient> {
        const patient = await this.findOne(id);
        Object.assign(patient, updateDto);
        return this.patientRepository.save(patient);
    }

    async remove(id: string): Promise<void> {
        const patient = await this.findOne(id);
        patient.deletedAt = new Date();
        await this.patientRepository.save(patient);
    }
}
