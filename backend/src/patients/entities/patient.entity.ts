import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
}

@Entity('patients')
export class Patient {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
    dateOfBirth: Date;

    @Column({ type: 'enum', enum: Gender, default: Gender.OTHER })
    gender: Gender;

    @Column({ nullable: true })
    bloodGroup: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    emergencyContact: string;

    @Column('text', { nullable: true })
    medicalHistory: string;

    @Column('text', { nullable: true })
    allergies: string;

    @Column()
    createdBy: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    deletedAt: Date;
}
