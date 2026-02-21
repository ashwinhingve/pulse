import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
    constructor(
        @InjectRepository(Doctor)
        private doctorRepository: Repository<Doctor>,
    ) { }

    async create(createDto: CreateDoctorDto): Promise<Doctor> {
        const doctor = this.doctorRepository.create(createDto);
        return this.doctorRepository.save(doctor);
    }

    async findAll(): Promise<Doctor[]> {
        return this.doctorRepository.find({
            where: { deletedAt: IsNull() },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Doctor> {
        const doctor = await this.doctorRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!doctor) {
            throw new NotFoundException('Doctor not found');
        }
        return doctor;
    }

    async update(id: string, updateDto: UpdateDoctorDto): Promise<Doctor> {
        const doctor = await this.findOne(id);
        Object.assign(doctor, updateDto);
        return this.doctorRepository.save(doctor);
    }

    async remove(id: string): Promise<void> {
        const doctor = await this.findOne(id);
        doctor.deletedAt = new Date();
        await this.doctorRepository.save(doctor);
    }
}
