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

interface ChatMessage {
    id: string;
    sender: string;
    content: string;
    timestamp: number;
    encrypted: boolean;
}

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers = new Map<string, string>(); // socketId -> userId

    constructor(private auditService: AuditService) { }

    async handleConnection(client: Socket) {
        const userId = client.handshake.auth.userId;

        if (!userId) {
            client.disconnect();
            return;
        }

        this.connectedUsers.set(client.id, userId);

        await this.auditService.log({
            action: 'chat_connect',
            userId,
            username: client.handshake.auth.username || 'unknown',
            ipAddress: client.handshake.address,
            success: true,
        });

        console.log(`User ${userId} connected to chat`);
    }

    async handleDisconnect(client: Socket) {
        const userId = this.connectedUsers.get(client.id);

        if (userId) {
            await this.auditService.log({
                action: 'chat_disconnect',
                userId,
                username: 'unknown',
                ipAddress: client.handshake.address,
                success: true,
            });

            this.connectedUsers.delete(client.id);
            console.log(`User ${userId} disconnected from chat`);
        }
    }

    @SubscribeMessage('send_message')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() message: ChatMessage,
    ) {
        const userId = this.connectedUsers.get(client.id);

        if (!userId) {
            return;
        }

        // Log message (encrypted payload, so no PII exposed)
        await this.auditService.log({
            action: 'chat_message_sent',
            userId,
            username: message.sender,
            ipAddress: client.handshake.address,
            success: true,
            metadata: {
                messageId: message.id,
                encrypted: message.encrypted,
            },
        });

        // Broadcast to all connected clients (E2EE, so server doesn't decrypt)
        this.server.emit('receive_message', message);
    }

    @SubscribeMessage('join_room')
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() room: string,
    ) {
        client.join(room);
        console.log(`Client ${client.id} joined room ${room}`);
    }

    @SubscribeMessage('leave_room')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() room: string,
    ) {
        client.leave(room);
        console.log(`Client ${client.id} left room ${room}`);
    }
}
