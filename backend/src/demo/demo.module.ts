import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';
import { User } from '../users/user.entity';
import { MedicalCase } from '../medical/entities/medical-case.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, MedicalCase])],
    controllers: [DemoController],
    providers: [DemoService],
    exports: [DemoService],
})
export class DemoModule { }
