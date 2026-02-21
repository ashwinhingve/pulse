import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Symptom } from './entities/symptom.entity';
import { SymptomsService } from './symptoms.service';
import { SymptomsController } from './symptoms.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Symptom])],
    controllers: [SymptomsController],
    providers: [SymptomsService],
    exports: [SymptomsService],
})
export class SymptomsModule { }
