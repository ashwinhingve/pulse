import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum ConversationType {
    USER_TO_USER = 'user_to_user',
    USER_TO_AI = 'user_to_ai',
}

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ConversationType,
    })
    type: ConversationType;

    @Column({ nullable: true })
    title: string;

    // For user-to-user conversations
    @Column({ nullable: true })
    participant1Id: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'participant1Id' })
    participant1: User;

    @Column({ nullable: true })
    participant2Id: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'participant2Id' })
    participant2: User;

    // For user-to-AI conversations
    @Column({ nullable: true })
    userId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    aiModel: string;

    // Metadata
    @Column({ type: 'jsonb', nullable: true })
    metadata: {
        caseId?: string;
        context?: string;
        lastMessagePreview?: string;
    };

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    lastMessageAt: Date;

    @Column({ default: 0 })
    unreadCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
