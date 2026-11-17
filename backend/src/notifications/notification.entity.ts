import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';

export type NotificationType = 'info' | 'warning' | 'success' | 'alert';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    userId: string;

    @Column({
        type: 'enum',
        enum: ['info', 'warning', 'success', 'alert'],
        default: 'info',
    })
    type: NotificationType;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({ nullable: true })
    link: string;

    @Column({ nullable: true })
    resourceType: string;

    @Column({ nullable: true })
    resourceId: string;

    @CreateDateColumn()
    @Index()
    createdAt: Date;
}
