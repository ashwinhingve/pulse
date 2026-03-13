import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class SendMessageDto {
    @IsUUID()
    conversationId: string;

    @IsString()
    content: string;

    @IsBoolean()
    @IsOptional()
    isEncrypted?: boolean;

    @IsUUID()
    @IsOptional()
    replyToId?: string;

    @IsString()
    @IsOptional()
    attachmentUrl?: string;
}

export class SendAIMessageDto {
    @IsUUID()
    conversationId: string;

    @IsString()
    content: string;

    @IsString()
    @IsOptional()
    systemPrompt?: string;
}
