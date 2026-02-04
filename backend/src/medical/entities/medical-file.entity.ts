import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';

export enum FileType {
    IMAGE = 'image',
    PDF = 'pdf',
    DICOM = 'dicom',
}

@Entity('medical_files')
export class MedicalFile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    caseId: string; // Reference to medical case

    @Column()
    originalName: string;

    @Column()
    storedName: string; // Encrypted filename on disk

    @Column({
        type: 'enum',
        enum: FileType,
    })
    fileType: FileType;

    @Column()
    mimeType: string;

    @Column({ type: 'bigint' })
    size: number;

    @Column()
    uploadedBy: string; // User ID

    @Column({ type: 'int', default: 0 })
    clearanceRequired: number;

    // Encryption metadata
    @Column({ nullable: true })
    encryptionKey: string; // Encrypted with master key

    @Column({ nullable: true })
    iv: string; // Initialization vector

    // Access tracking
    @Column({ default: 0 })
    accessCount: number;

    @Column({ nullable: true })
    lastAccessedAt: Date;

    @CreateDateColumn()
    uploadedAt: Date;

    @Column({ nullable: true })
    deletedAt: Date;
}
