import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto, SendAIMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post('conversations')
    createConversation(@Request() req: any, @Body() dto: CreateConversationDto) {
        return this.chatService.createConversation(req.user.sub, dto);
    }

    @Get('conversations')
    getConversations(@Request() req: any) {
        return this.chatService.getConversations(req.user.sub);
    }

    @Get('conversations/:id')
    getConversation(@Request() req: any, @Param('id') id: string) {
        return this.chatService.getConversation(req.user.sub, id);
    }

    @Get('conversations/:id/messages')
    getMessages(
        @Request() req: any,
        @Param('id') id: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.chatService.getMessages(req.user.sub, id, limit || 50, offset || 0);
    }

    @Post('messages')
    sendMessage(@Request() req: any, @Body() dto: SendMessageDto) {
        return this.chatService.sendMessage(req.user.sub, dto);
    }

    @Post('messages/ai')
    sendAIMessage(@Request() req: any, @Body() dto: SendAIMessageDto) {
        return this.chatService.sendAIMessage(req.user.sub, dto);
    }

    @Post('conversations/:id/read')
    markAsRead(@Request() req: any, @Param('id') id: string) {
        return this.chatService.markAsRead(req.user.sub, id);
    }

    @Get('partners')
    getAvailableChatPartners(@Request() req: any) {
        return this.chatService.getAvailableChatPartners(req.user.sub);
    }

    @Delete('conversations/:id')
    deleteConversation(@Request() req: any, @Param('id') id: string) {
        return this.chatService.deleteConversation(req.user.sub, id);
    }
}
