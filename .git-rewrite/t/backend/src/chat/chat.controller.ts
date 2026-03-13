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
    UseInterceptors,
    UploadedFile,
    Header,
    Res,
    StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { join } from 'path';
import { createReadStream } from 'fs';
import { ChatService } from './chat.service';
import { ChatFileService } from './chat-file.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto, SendAIMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly chatFileService: ChatFileService,
    ) {}

    @Post('conversations')
    createConversation(@Request() req: any, @Body() dto: CreateConversationDto) {
        return this.chatService.createConversation(req.user.userId, dto);
    }

    @Get('conversations')
    getConversations(@Request() req: any) {
        return this.chatService.getConversations(req.user.userId);
    }

    @Get('conversations/:id')
    getConversation(@Request() req: any, @Param('id') id: string) {
        return this.chatService.getConversation(req.user.userId, id);
    }

    @Get('conversations/:id/messages')
    getMessages(
        @Request() req: any,
        @Param('id') id: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.chatService.getMessages(req.user.userId, id, limit || 50, offset || 0);
    }

    @Post('messages')
    async sendMessage(@Request() req: any, @Body() dto: SendMessageDto) {
        const { message } = await this.chatService.sendMessage(req.user.userId, dto);
        return message;
    }

    @Post('messages/ai')
    sendAIMessage(@Request() req: any, @Body() dto: SendAIMessageDto) {
        return this.chatService.sendAIMessage(req.user.userId, dto);
    }

    @Post('conversations/:id/read')
    markAsRead(@Request() req: any, @Param('id') id: string) {
        return this.chatService.markAsRead(req.user.userId, id);
    }

    @Get('partners')
    getAvailableChatPartners(@Request() req: any) {
        return this.chatService.getAvailableChatPartners(req.user.userId);
    }

    @Delete('conversations/:id')
    deleteConversation(@Request() req: any, @Param('id') id: string) {
        return this.chatService.deleteConversation(req.user.userId, id);
    }

    @Post('attachments')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
                cb(null, allowed.includes(file.mimetype));
            },
        }),
    )
    uploadAttachment(
        @Request() req: any,
        @UploadedFile() file: Express.Multer.File,
        @Query('conversationId') conversationId: string,
    ) {
        return this.chatFileService.uploadAttachment(file, req.user.userId, conversationId);
    }

    @Get('attachments/:filename')
    @Header('Cache-Control', 'private, max-age=86400')
    serveAttachment(@Param('filename') filename: string, @Res() res: Response) {
        // Sanitize filename to prevent path traversal
        const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = join(process.cwd(), 'uploads', 'chat', safe);
        res.sendFile(filePath);
    }
}
