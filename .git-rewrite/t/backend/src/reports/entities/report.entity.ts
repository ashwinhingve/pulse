import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

export enum ReportType {
    LAB = 'lab',
    IMAGING = 'imaging',
    PRESCRIPTION = 'prescription',
    DISCHARGE = 'discharge',
    FOLLOWUP = 'followup',
}

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'enum', enum: ReportType, default: ReportType.LAB })
    type: ReportType;

    @Column('text', { nullable: true })
    findings: string;

    @Column('text', { nullable: true })
    recommendations: string;

    @Column()
    patientId: string;

    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column()
    doctorId: string;

    @ManyToOne(() => Doctor)
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;

    @Column({ nullable: true })
    diagnosisId: string;

    @Column('jsonb', { nullable: true })
    attachments: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    deletedAt: Date;
}
