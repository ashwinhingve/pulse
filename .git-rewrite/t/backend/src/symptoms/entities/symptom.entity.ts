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

export enum SymptomSeverity {
    MILD = 'mild',
    MODERATE = 'moderate',
    SEVERE = 'severe',
}

@Entity('symptoms')
export class Symptom {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ type: 'enum', enum: SymptomSeverity, default: SymptomSeverity.MILD })
    severity: SymptomSeverity;

    @Column({ nullable: true })
    bodyArea: string;

    @Column({ nullable: true })
    duration: string;

    @Column()
    patientId: string;

    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column()
    reportedBy: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    deletedAt: Date;
}
