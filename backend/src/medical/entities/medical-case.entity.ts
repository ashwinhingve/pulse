import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum CaseSeverity {
    ROUTINE = 'routine',
    URGENT = 'urgent',
    CRITICAL = 'critical',
}

export enum CaseStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    ARCHIVED = 'archived',
}

@Entity('medical_cases')
export class MedicalCase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Anonymized patient reference (NOT real identity)
    @Column()
    @Index()
    patientCode: string; // e.g., "P-2024-001234"

    // Medical officer who created the case
    @Column()
    @Index()
    createdBy: string; // User ID

    @Column({ nullable: true })
    assignedTo: string; // User ID

    @Column({
        type: 'enum',
        enum: CaseSeverity,
        default: CaseSeverity.ROUTINE,
    })
    severity: CaseSeverity;

    @Column({
        type: 'enum',
        enum: CaseStatus,
        default: CaseStatus.OPEN,
    })
    status: CaseStatus;

    // Medical data (encrypted at rest)
    @Column('text')
    chiefComplaint: string;

    @Column('text')
    symptoms: string;

    @Column('jsonb', { nullable: true })
    vitals: Record<string, any>; // { temp: 98.6, bp: "120/80", hr: 72 }

    @Column('text', { nullable: true })
    medicalHistory: string;

    @Column('text', { nullable: true })
    assessment: string;

    @Column('text', { nullable: true })
    plan: string;

    @Column('simple-array', { nullable: true })
    attachments: string[]; // File IDs

    // AI interaction tracking
    @Column({ default: false })
    aiAssisted: boolean;

    @Column('jsonb', { nullable: true })
    aiSuggestions: Record<string, any>;

    // Clearance level required to view
    @Column({ type: 'int', default: 0 })
    clearanceRequired: number;

    // Audit fields
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    closedAt: Date;

    @Column({ nullable: true })
    deletedAt: Date;
}
