import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepo: Repository<Notification>,
    ) {}

    async findAllForUser(userId: string): Promise<Notification[]> {
        return this.notificationRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 20,
        });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationRepo.count({
            where: { userId, isRead: false },
        });
    }

    async markAsRead(id: string, userId: string): Promise<{ success: boolean }> {
        await this.notificationRepo.update(
            { id, userId },
            { isRead: true },
        );
        return { success: true };
    }

    async markAllAsRead(userId: string): Promise<{ success: boolean; count: number }> {
        const result = await this.notificationRepo.update(
            { userId, isRead: false },
            { isRead: true },
        );
        return { success: true, count: result.affected || 0 };
    }

    async create(data: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        link?: string;
        resourceType?: string;
        resourceId?: string;
    }): Promise<Notification> {
        const notification = this.notificationRepo.create(data);
        return this.notificationRepo.save(notification);
    }

    async createForAllUsers(
        userIds: string[],
        data: {
            type: NotificationType;
            title: string;
            message: string;
            link?: string;
        },
    ): Promise<void> {
        const notifications = userIds.map(userId =>
            this.notificationRepo.create({ userId, ...data }),
        );
        await this.notificationRepo.save(notifications);
    }

    async delete(id: string, userId: string): Promise<{ success: boolean }> {
        await this.notificationRepo.delete({ id, userId });
        return { success: true };
    }

    async seedDemoNotifications(userIds: Record<string, string>): Promise<void> {
        const demos = [
            {
                userId: userIds['maj.harris'] || Object.values(userIds)[0],
                type: 'alert' as NotificationType,
                title: 'Critical Lab Result',
                message: 'Patient #MIL-2024-001 has abnormal CBC results that require immediate clinical review.',
                link: '/dashboard/cases',
            },
            {
                userId: userIds['maj.harris'] || Object.values(userIds)[0],
                type: 'info' as NotificationType,
                title: 'New Case Assigned',
                message: 'Case #MIL-2024-002 (Heat Exhaustion) has been assigned to Field Medical Unit Alpha.',
                link: '/dashboard/cases',
            },
            {
                userId: userIds['dr.williams'] || Object.values(userIds)[1],
                type: 'success' as NotificationType,
                title: 'Document Analysis Complete',
                message: 'AI analysis of the uploaded blood report is ready. Click to view findings.',
                link: '/dashboard/documents',
            },
            {
                userId: userIds['dr.williams'] || Object.values(userIds)[1],
                type: 'warning' as NotificationType,
                title: 'System Maintenance',
                message: 'Scheduled maintenance window at 02:00 UTC tonight. Save any in-progress work.',
            },
            {
                userId: userIds['admin'] || Object.values(userIds)[0],
                type: 'info' as NotificationType,
                title: 'New User Registration',
                message: '3 new user registrations are pending approval in the Admin Panel.',
                link: '/admin',
            },
            {
                userId: userIds['admin'] || Object.values(userIds)[0],
                type: 'success' as NotificationType,
                title: 'Audit Trail Verified',
                message: 'All 47 audit log entries have passed integrity verification (hash chain intact).',
                link: '/dashboard/audit',
            },
        ];

        for (const demo of demos) {
            if (demo.userId) {
                const existing = await this.notificationRepo.findOne({
                    where: { userId: demo.userId, title: demo.title },
                });
                if (!existing) {
                    await this.notificationRepo.save(this.notificationRepo.create(demo));
                }
            }
        }
    }
}
