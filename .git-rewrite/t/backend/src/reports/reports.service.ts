import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Report)
        private reportRepository: Repository<Report>,
    ) { }

    async create(createDto: CreateReportDto): Promise<Report> {
        const report = this.reportRepository.create(createDto);
        return this.reportRepository.save(report);
    }

    async findAll(): Promise<Report[]> {
        return this.reportRepository.find({
            where: { deletedAt: IsNull() },
            relations: ['patient', 'doctor'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByPatient(patientId: string): Promise<Report[]> {
        return this.reportRepository.find({
            where: { patientId, deletedAt: IsNull() },
            relations: ['doctor'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Report> {
        const report = await this.reportRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['patient', 'doctor'],
        });
        if (!report) {
            throw new NotFoundException('Report not found');
        }
        return report;
    }

    async update(id: string, updateDto: UpdateReportDto): Promise<Report> {
        const report = await this.findOne(id);
        Object.assign(report, updateDto);
        return this.reportRepository.save(report);
    }

    async remove(id: string): Promise<void> {
        const report = await this.findOne(id);
        report.deletedAt = new Date();
        await this.reportRepository.save(report);
    }
}
