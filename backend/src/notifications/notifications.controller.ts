import {
    Controller, Get, Patch, Delete, Param,
    UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    /** GET /api/notifications — all notifications for current user */
    @Get()
    findAll(@Request() req: any) {
        return this.notificationsService.findAllForUser(req.user.id);
    }

    /** GET /api/notifications/unread-count */
    @Get('unread-count')
    async unreadCount(@Request() req: any) {
        const count = await this.notificationsService.getUnreadCount(req.user.id);
        return { count };
    }

    /** PATCH /api/notifications/:id/read — mark one as read */
    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @Request() req: any) {
        return this.notificationsService.markAsRead(id, req.user.id);
    }

    /** PATCH /api/notifications/read-all — mark all as read */
    @Patch('read-all')
    markAllAsRead(@Request() req: any) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }

    /** DELETE /api/notifications/:id */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    delete(@Param('id') id: string, @Request() req: any) {
        return this.notificationsService.delete(id, req.user.id);
    }
}
