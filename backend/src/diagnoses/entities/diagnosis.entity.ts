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

export enum DiagnosisStatus {
    PRELIMINARY = 'preliminary',
    CONFIRMED = 'confirmed',
    RULED_OUT = 'ruled_out',
}

@Entity('diagnoses')
export class Diagnosis {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    diseaseName: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ nullable: true })
    icdCode: string;

    @Column({ type: 'enum', enum: DiagnosisStatus, default: DiagnosisStatus.PRELIMINARY })
    status: DiagnosisStatus;

    @Column('text', { nullable: true })
    notes: string;

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
    diagnosedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    deletedAt: Date;
}
