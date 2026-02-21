import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diagnosis } from './entities/diagnosis.entity';
import { DiagnosesService } from './diagnoses.service';
import { DiagnosesController } from './diagnoses.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Diagnosis])],
    controllers: [DiagnosesController],
    providers: [DiagnosesService],
    exports: [DiagnosesService],
})
export class DiagnosesModule { }
