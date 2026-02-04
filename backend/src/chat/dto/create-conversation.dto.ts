import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ConversationType } from '../entities/conversation.entity';

export class CreateConversationDto {
    @IsEnum(ConversationType)
    type: ConversationType;

    @IsString()
    @IsOptional()
    title?: string;

    // For user-to-user conversations
    @IsUUID()
    @IsOptional()
    recipientId?: string;

    // For user-to-AI conversations
    @IsString()
    @IsOptional()
    aiModel?: string;

    @IsString()
    @IsOptional()
    context?: string;

    @IsUUID()
    @IsOptional()
    caseId?: string;
}
