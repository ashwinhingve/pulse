import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalService } from './medical.service';
import { MedicalController } from './medical.controller';
import { MedicalCase } from './entities/medical-case.entity';

@Module({
    imports: [TypeOrmModule.forFeature([MedicalCase])],
    controllers: [MedicalController],
    providers: [MedicalService],
    exports: [MedicalService],
})
export class MedicalModule { }
