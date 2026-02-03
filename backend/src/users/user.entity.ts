import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole, ClearanceLevel } from '../common/enums/roles.enum';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @Index()
    username: string;

    @Column()
    @Exclude()
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.PUBLIC,
    })
    role: UserRole;

    @Column({
        type: 'int',
        default: ClearanceLevel.UNCLASSIFIED,
    })
    clearanceLevel: ClearanceLevel;

    @Column({ nullable: true })
    @Exclude()
    mfaSecret: string;

    @Column({ default: false })
    mfaEnabled: boolean;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    lastLoginAt: Date;

    @Column({ nullable: true })
    lastLoginIp: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    deletedAt: Date;
}
