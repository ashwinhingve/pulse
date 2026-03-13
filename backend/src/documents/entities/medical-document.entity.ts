import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';

export enum DocumentType {
    XRAY = 'xray',
    ECG = 'ecg',
    BLOOD_REPORT = 'blood_report',
    MRI = 'mri',
    CT_SCAN = 'ct_scan',
    ULTRASOUND_ECHO = 'ultrasound_echo',
}

export enum DocumentRiskLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export interface KeyMeasurement {
    name: string;
    value: string | number;
    unit?: string;
    normalRange?: string;
    isAbnormal: boolean;
}

export interface AIAnalysisResult {
    summary: string;
    riskLevel: DocumentRiskLevel;
    riskIndicators: string[];
    abnormalFindings: string[];
    normalFindings: string[];
    confidenceScore: number; // 0.0 – 1.0
    keyMeasurements: KeyMeasurement[];
    recommendations: string[];
    rawAnalysis: string;
    model: string;
    analyzedAt: string;
}

@Entity('medical_documents')
export class MedicalDocument {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Patient / case linkage (optional)
    @Index()
    @Column({ nullable: true })
    patientId: string;

    @Index()
    @Column({ nullable: true })
    caseId: string;

    // Document classification
    @Column({ type: 'varchar' })
    documentType: DocumentType;

    // ── Encrypted file storage ────────────────────────────────
    @Column()
    storedName: string; // UUID.enc on disk

    @Column()
    originalFileName: string;

    @Column()
    mimeType: string;

    @Column({ type: 'bigint', default: 0 })
    fileSize: number;

    @Column()
    encryptionKey: string; // File key encrypted with master key (base64)

    @Column()
    iv: string; // Combined keyIv + fileIv (base64)

    @Column({ default: 0 })
    accessCount: number;

    // ── Report metadata ───────────────────────────────────────
    @Column({ nullable: true, type: 'timestamptz' })
    reportDate: Date;

    @Column({ nullable: true })
    hospitalName: string;

    @Column({ nullable: true })
    doctorName: string;

    @Column({ nullable: true, type: 'text' })
    notes: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    // ── AI analysis ───────────────────────────────────────────
    @Column({ type: 'jsonb', nullable: true })
    aiAnalysis: AIAnalysisResult;

    @Column({ default: false })
    isAnalyzed: boolean;

    @Column({ default: false })
    isAnalyzing: boolean;

    // ── Access control ────────────────────────────────────────
    @Index()
    @Column()
    uploadedBy: string;

    @Column({ type: 'int', default: 0 })
    clearanceRequired: number;

    // ── Timestamps ────────────────────────────────────────────
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
