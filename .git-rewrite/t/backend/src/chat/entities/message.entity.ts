import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Conversation } from './conversation.entity';

export enum MessageSender {
    USER = 'user',
    AI = 'ai',
    SYSTEM = 'system',
}

export enum MessageStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed',
}

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    conversationId: string;

    @ManyToOne(() => Conversation)
    @JoinColumn({ name: 'conversationId' })
    conversation: Conversation;

    @Column({ nullable: true })
    senderId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'senderId' })
    sender: User;

    @Column({
        type: 'enum',
        enum: MessageSender,
        default: MessageSender.USER,
    })
    senderType: MessageSender;

    @Column({ type: 'text' })
    content: string;

    @Column({ default: false })
    isEncrypted: boolean;

    @Column({
        type: 'enum',
        enum: MessageStatus,
        default: MessageStatus.SENT,
    })
    status: MessageStatus;

    @Column({ type: 'jsonb', nullable: true })
    metadata: {
        attachments?: string[];
        replyToId?: string;
        aiModel?: string;
        tokens?: number;
        anonymized?: boolean;
    };

    @Column({ nullable: true })
    readAt: Date;

    @CreateDateColumn()
    @Index()
    createdAt: Date;
}
