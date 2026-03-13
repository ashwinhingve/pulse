import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { ChatService } from './chat.service';
import { MessageStatus } from './entities/message.entity';

interface SocketMessage {
    conversationId: string;
    content: string;
    encrypted?: boolean;
    replyToId?: string;
    attachmentUrl?: string;
}

interface TypingIndicator {
    conversationId: string;
    isTyping: boolean;
}

@WebSocketGateway({
    cors: { origin: true, credentials: true },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
    private socketToUser = new Map<string, string>(); // socketId -> userId

    constructor(
        private auditService: AuditService,
        private chatService: ChatService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async handleConnection(client: Socket) {
        // Extract token from handshake auth or authorization header
        const token =
            client.handshake.auth?.token ||
            (client.handshake.headers?.authorization?.startsWith('Bearer ')
                ? client.handshake.headers.authorization.slice(7)
                : null);

        if (!token) {
            client.emit('auth_error', { message: 'No authentication token provided' });
            client.disconnect();
            return;
        }

        let payload: any;
        try {
            payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });
        } catch (err) {
            client.emit('auth_error', { message: 'Invalid or expired token' });
            client.disconnect();
            return;
        }

        const userId: string = payload.sub;
        const username: string = payload.username || 'unknown';

        // Store verified identity on client
        client.data.userId = userId;
        client.data.username = username;

        // Track user connection
        this.socketToUser.set(client.id, userId);

        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId)!.add(client.id);

        // Join user's personal room
        client.join(`user:${userId}`);

        // Get user's conversations and join their rooms
        try {
            const conversations = await this.chatService.getConversations(userId);
            conversations.forEach((conv) => {
                client.join(`conversation:${conv.id}`);
            });
        } catch (error) {
            console.error('Failed to join conversation rooms:', error);
        }

        await this.auditService.log({
            action: 'chat_connect',
            userId,
            username,
            ipAddress: client.handshake.address,
            success: true,
        });

        // Notify others (not self) that user is online
        client.broadcast.emit('user_online', { userId, username });
        console.log(`User ${userId} (${username}) connected to chat`);
    }

    async handleDisconnect(client: Socket) {
        const userId = this.socketToUser.get(client.id);

        if (userId) {
            this.socketToUser.delete(client.id);

            const userSockets = this.connectedUsers.get(userId);
            if (userSockets) {
                userSockets.delete(client.id);
                if (userSockets.size === 0) {
                    this.connectedUsers.delete(userId);
                    // Notify others that user is offline
                    client.broadcast.emit('user_offline', { userId });
                }
            }

            await this.auditService.log({
                action: 'chat_disconnect',
                userId,
                username: client.data.username || 'unknown',
                ipAddress: client.handshake.address,
                success: true,
            });

            console.log(`User ${userId} disconnected from chat`);
        }
    }

    @SubscribeMessage('send_message')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: SocketMessage,
    ) {
        const userId = client.data.userId;

        if (!userId) {
            return { error: 'Not authenticated' };
        }

        try {
            const { message, recipientId } = await this.chatService.sendMessage(userId, {
                conversationId: data.conversationId,
                content: data.content,
                isEncrypted: data.encrypted,
                replyToId: data.replyToId,
                attachmentUrl: data.attachmentUrl,
            });

            // Broadcast to conversation room
            this.server.to(`conversation:${data.conversationId}`).emit('new_message', {
                ...message,
                senderUsername: client.data.username,
            });

            // Emit unread_update to recipient's personal room
            if (recipientId) {
                try {
                    const conv = await this.chatService.getConversation(userId, data.conversationId);
                    this.server.to(`user:${recipientId}`).emit('unread_update', {
                        conversationId: data.conversationId,
                        unreadCount: conv.unreadCount,
                    });
                } catch (_) {
                    // Non-critical: unread count update can be skipped
                }
            }

            return { success: true, message };
        } catch (error) {
            console.error('Failed to send message:', error);
            return { error: 'Failed to send message' };
        }
    }

    @SubscribeMessage('send_ai_message')
    async handleAIMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string; content: string },
    ) {
        const userId = client.data.userId;

        if (!userId) {
            return { error: 'Not authenticated' };
        }

        try {
            // Send typing indicator
            client.emit('ai_typing', { conversationId: data.conversationId, isTyping: true });

            const result = await this.chatService.sendAIMessage(userId, {
                conversationId: data.conversationId,
                content: data.content,
            });

            // Stop typing indicator
            client.emit('ai_typing', { conversationId: data.conversationId, isTyping: false });

            // Broadcast user message and AI response to the conversation room
            // (all client tabs for this user are in the conversation room)
            this.server.to(`conversation:${data.conversationId}`).emit('new_message', result.userMessage);
            this.server.to(`conversation:${data.conversationId}`).emit('new_message', result.aiResponse);

            return { success: true, ...result };
        } catch (error) {
            client.emit('ai_typing', { conversationId: data.conversationId, isTyping: false });
            console.error('Failed to get AI response:', error);
            return { error: 'Failed to get AI response' };
        }
    }

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: TypingIndicator,
    ) {
        const userId = client.data.userId;
        if (!userId) return;

        // Broadcast typing indicator to conversation room (except sender)
        client.to(`conversation:${data.conversationId}`).emit('user_typing', {
            userId,
            username: client.data.username,
            conversationId: data.conversationId,
            isTyping: data.isTyping,
        });
    }

    @SubscribeMessage('join_conversation')
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() conversationId: string,
    ) {
        const userId = client.data.userId;
        if (!userId) return { error: 'Not authenticated' };

        try {
            // Verify user has access to this conversation
            await this.chatService.getConversation(userId, conversationId);
            client.join(`conversation:${conversationId}`);
            return { success: true };
        } catch (error) {
            return { error: 'Access denied' };
        }
    }

    @SubscribeMessage('leave_conversation')
    handleLeaveConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() conversationId: string,
    ) {
        client.leave(`conversation:${conversationId}`);
        return { success: true };
    }

    @SubscribeMessage('mark_read')
    async handleMarkRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() conversationId: string,
    ) {
        const userId = client.data.userId;
        if (!userId) return { error: 'Not authenticated' };

        try {
            await this.chatService.markAsRead(userId, conversationId);
            // Notify caller that unread is cleared
            this.server.to(`user:${userId}`).emit('unread_cleared', { conversationId });
            // Notify all conversation participants that messages were read (read receipts)
            this.server.to(`conversation:${conversationId}`).emit('message_status', {
                conversationId,
                status: MessageStatus.READ,
            });
            return { success: true };
        } catch (error) {
            return { error: 'Failed to mark as read' };
        }
    }

    @SubscribeMessage('mark_delivered')
    async handleMarkDelivered(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const userId = client.data.userId;
        if (!userId) return { error: 'Not authenticated' };

        try {
            await this.chatService.updateMessageStatus(
                data.conversationId,
                userId,
                MessageStatus.SENT,
                MessageStatus.DELIVERED,
            );

            // Notify conversation room of status change
            this.server.to(`conversation:${data.conversationId}`).emit('message_status', {
                conversationId: data.conversationId,
                status: MessageStatus.DELIVERED,
            });

            return { success: true };
        } catch (error) {
            return { error: 'Failed to mark as delivered' };
        }
    }

    // Helper method to check if a user is online
    isUserOnline(userId: string): boolean {
        return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
    }

    // Helper method to send message to specific user
    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
}
