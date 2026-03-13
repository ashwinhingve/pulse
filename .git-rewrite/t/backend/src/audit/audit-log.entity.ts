import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    @Index()
    timestamp: Date;

    @Column({ nullable: true })
    @Index()
    userId: string;

    @Column({ nullable: true })
    username: string;

    @Column()
    @Index()
    action: string;

    @Column({ nullable: true })
    resource: string;

    @Column({ nullable: true })
    resourceId: string;

    @Column()
    ipAddress: string;

    @Column({ nullable: true })
    userAgent: string;

    @Column({ nullable: true })
    deviceId: string;

    @Column()
    success: boolean;

    @Column({ nullable: true })
    errorMessage: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ nullable: true })
    previousHash: string;

    @Column()
    currentHash: string;
}
