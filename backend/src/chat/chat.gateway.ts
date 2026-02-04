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
import { AuditService } from '../audit/audit.service';
import { ChatService } from './chat.service';
import { ConversationType } from './entities/conversation.entity';

interface SocketMessage {
    conversationId: string;
    content: string;
    encrypted?: boolean;
    replyToId?: string;
}

interface TypingIndicator {
    conversationId: string;
    isTyping: boolean;
}

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
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
    ) {}

    async handleConnection(client: Socket) {
        const userId = client.handshake.auth.userId;
        const username = client.handshake.auth.username;

        if (!userId) {
            client.disconnect();
            return;
        }

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
            username: username || 'unknown',
            ipAddress: client.handshake.address,
            success: true,
        });

        // Notify others that user is online
        this.server.emit('user_online', { userId, username });
        console.log(`User ${userId} connected to chat`);
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
                    this.server.emit('user_offline', { userId });
                }
            }

            await this.auditService.log({
                action: 'chat_disconnect',
                userId,
                username: 'unknown',
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
        const userId = this.socketToUser.get(client.id);

        if (!userId) {
            return { error: 'Not authenticated' };
        }

        try {
            const message = await this.chatService.sendMessage(userId, {
                conversationId: data.conversationId,
                content: data.content,
                isEncrypted: data.encrypted,
                replyToId: data.replyToId,
            });

            // Broadcast to conversation room
            this.server.to(`conversation:${data.conversationId}`).emit('new_message', {
                ...message,
                senderUsername: client.handshake.auth.username,
            });

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
        const userId = this.socketToUser.get(client.id);

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

            // Broadcast user message and AI response to the user's room
            this.server.to(`user:${userId}`).emit('new_message', result.userMessage);
            this.server.to(`user:${userId}`).emit('new_message', result.aiResponse);

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
        const userId = this.socketToUser.get(client.id);
        if (!userId) return;

        // Broadcast typing indicator to conversation room (except sender)
        client.to(`conversation:${data.conversationId}`).emit('user_typing', {
            userId,
            username: client.handshake.auth.username,
            conversationId: data.conversationId,
            isTyping: data.isTyping,
        });
    }

    @SubscribeMessage('join_conversation')
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() conversationId: string,
    ) {
        const userId = this.socketToUser.get(client.id);
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
        const userId = this.socketToUser.get(client.id);
        if (!userId) return { error: 'Not authenticated' };

        try {
            await this.chatService.markAsRead(userId, conversationId);
            return { success: true };
        } catch (error) {
            return { error: 'Failed to mark as read' };
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
