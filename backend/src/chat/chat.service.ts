import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { Message, MessageSender, MessageStatus } from './entities/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto, SendAIMessageDto } from './dto/send-message.dto';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { AiService } from '../ai/ai.service';
import { ROLE_PERMISSIONS } from '../common/enums/roles.enum';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Conversation)
        private conversationRepository: Repository<Conversation>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private auditService: AuditService,
        private aiService: AiService,
    ) {}

    async createConversation(userId: string, dto: CreateConversationDto): Promise<Conversation> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        let conversation: Conversation;

        if (dto.type === ConversationType.USER_TO_USER) {
            // Verify chat permissions
            const permissions = ROLE_PERMISSIONS[user.role];
            const canChat = permissions.canChatWithPublicOfficials || permissions.canChatWithArmyOfficers;

            if (!canChat) {
                throw new ForbiddenException('You do not have permission to chat with other users');
            }

            // Check for existing conversation
            const existing = await this.conversationRepository.findOne({
                where: [
                    { participant1Id: userId, participant2Id: dto.recipientId, isActive: true },
                    { participant1Id: dto.recipientId, participant2Id: userId, isActive: true },
                ],
            });

            if (existing) {
                return existing;
            }

            const recipient = await this.userRepository.findOne({ where: { id: dto.recipientId } });
            if (!recipient) {
                throw new NotFoundException('Recipient not found');
            }

            conversation = this.conversationRepository.create({
                type: ConversationType.USER_TO_USER,
                title: dto.title || `Chat with ${recipient.fullName || recipient.username}`,
                participant1Id: userId,
                participant2Id: dto.recipientId,
                metadata: { caseId: dto.caseId },
            });
        } else {
            // User-to-AI conversation
            const permissions = ROLE_PERMISSIONS[user.role];
            if (!permissions.canChatWithAI) {
                throw new ForbiddenException('You do not have permission to chat with AI');
            }

            conversation = this.conversationRepository.create({
                type: ConversationType.USER_TO_AI,
                title: dto.title || 'AI Assistant',
                userId,
                aiModel: dto.aiModel || 'gemini-pro',
                metadata: { caseId: dto.caseId, context: dto.context },
            });
        }

        const saved = await this.conversationRepository.save(conversation);

        await this.auditService.log({
            action: 'conversation_created',
            userId,
            username: user.username,
            ipAddress: 'internal',
            success: true,
            metadata: { conversationId: saved.id, type: dto.type },
        });

        return saved;
    }

    async getConversations(userId: string): Promise<Conversation[]> {
        const userConversations = await this.conversationRepository.find({
            where: [
                { participant1Id: userId, isActive: true },
                { participant2Id: userId, isActive: true },
                { userId, isActive: true },
            ],
            relations: ['participant1', 'participant2', 'user'],
            order: { lastMessageAt: 'DESC' },
        });

        return userConversations;
    }

    async getConversation(userId: string, conversationId: string): Promise<Conversation> {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: ['participant1', 'participant2', 'user'],
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Check if user is a participant
        const isParticipant =
            conversation.participant1Id === userId ||
            conversation.participant2Id === userId ||
            conversation.userId === userId;

        if (!isParticipant) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        return conversation;
    }

    async getMessages(userId: string, conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
        // Verify access
        await this.getConversation(userId, conversationId);

        const messages = await this.messageRepository.find({
            where: { conversationId },
            relations: ['sender'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });

        return messages.reverse();
    }

    async sendMessage(userId: string, dto: SendMessageDto): Promise<Message> {
        const conversation = await this.getConversation(userId, dto.conversationId);
        const user = await this.userRepository.findOne({ where: { id: userId } });

        const message = this.messageRepository.create({
            conversationId: dto.conversationId,
            senderId: userId,
            senderType: MessageSender.USER,
            content: dto.content,
            isEncrypted: dto.isEncrypted || false,
            metadata: dto.replyToId ? { replyToId: dto.replyToId } : undefined,
        });

        const saved = await this.messageRepository.save(message);

        // Update conversation
        await this.conversationRepository.update(dto.conversationId, {
            lastMessageAt: new Date(),
            metadata: {
                ...conversation.metadata,
                lastMessagePreview: dto.content.substring(0, 100),
            },
        });

        await this.auditService.log({
            action: 'message_sent',
            userId,
            username: user?.username || 'unknown',
            ipAddress: 'internal',
            success: true,
            metadata: {
                conversationId: dto.conversationId,
                messageId: saved.id,
                encrypted: dto.isEncrypted,
            },
        });

        return saved;
    }

    async sendAIMessage(userId: string, dto: SendAIMessageDto): Promise<{ userMessage: Message; aiResponse: Message }> {
        const conversation = await this.getConversation(userId, dto.conversationId);

        if (conversation.type !== ConversationType.USER_TO_AI) {
            throw new ForbiddenException('This is not an AI conversation');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });

        // Save user message
        const userMessage = this.messageRepository.create({
            conversationId: dto.conversationId,
            senderId: userId,
            senderType: MessageSender.USER,
            content: dto.content,
        });
        await this.messageRepository.save(userMessage);

        // Get AI response
        let aiResponseContent: string;
        try {
            const response = await this.aiService.getMedicalAssistance({
                query: dto.content,
                context: conversation.metadata?.context,
                systemPrompt: dto.systemPrompt,
            });
            aiResponseContent = response.response;
        } catch (error) {
            aiResponseContent = 'I apologize, but I encountered an error processing your request. Please try again.';
        }

        // Save AI response
        const aiResponse = this.messageRepository.create({
            conversationId: dto.conversationId,
            senderType: MessageSender.AI,
            content: aiResponseContent,
            metadata: {
                aiModel: conversation.aiModel,
                anonymized: true,
            },
        });
        await this.messageRepository.save(aiResponse);

        // Update conversation
        await this.conversationRepository.update(dto.conversationId, {
            lastMessageAt: new Date(),
            metadata: {
                ...conversation.metadata,
                lastMessagePreview: aiResponseContent.substring(0, 100),
            },
        });

        await this.auditService.log({
            action: 'ai_message_sent',
            userId,
            username: user?.username || 'unknown',
            ipAddress: 'internal',
            success: true,
            metadata: {
                conversationId: dto.conversationId,
                model: conversation.aiModel,
            },
        });

        return { userMessage, aiResponse };
    }

    async markAsRead(userId: string, conversationId: string): Promise<void> {
        await this.getConversation(userId, conversationId);

        await this.messageRepository.update(
            { conversationId, status: MessageStatus.DELIVERED },
            { status: MessageStatus.READ, readAt: new Date() }
        );

        await this.conversationRepository.update(conversationId, { unreadCount: 0 });
    }

    async getAvailableChatPartners(userId: string): Promise<User[]> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const permissions = ROLE_PERMISSIONS[user.role];

        // Build query based on permissions
        const queryBuilder = this.userRepository.createQueryBuilder('user')
            .where('user.id != :userId', { userId })
            .andWhere('user.isActive = :isActive', { isActive: true });

        // Filter by allowed roles based on permissions
        const allowedRoles: string[] = [];
        if (permissions.canChatWithArmyOfficers) {
            allowedRoles.push('army_medical_officer');
        }
        if (permissions.canChatWithPublicOfficials) {
            allowedRoles.push('public_medical_official');
        }

        if (allowedRoles.length > 0) {
            queryBuilder.andWhere('user.role IN (:...roles)', { roles: allowedRoles });
        }

        return queryBuilder.getMany();
    }

    async deleteConversation(userId: string, conversationId: string): Promise<void> {
        const conversation = await this.getConversation(userId, conversationId);

        await this.conversationRepository.update(conversationId, { isActive: false });

        await this.auditService.log({
            action: 'conversation_deleted',
            userId,
            ipAddress: 'internal',
            success: true,
            metadata: { conversationId },
        });
    }
}
