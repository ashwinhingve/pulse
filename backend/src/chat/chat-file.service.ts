import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class ChatFileService {
    constructor(private chatService: ChatService) {}

    async uploadAttachment(
        file: Express.Multer.File,
        userId: string,
        conversationId: string,
    ): Promise<{ url: string; originalName: string; mimeType: string; size: number }> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException('File size exceeds the 10 MB limit');
        }

        // Verify user is a conversation participant
        await this.chatService.getConversation(userId, conversationId);

        const ext = extname(file.originalname) || this.mimeToExt(file.mimetype);
        const storedName = `${randomUUID()}${ext}`;
        const uploadDir = join(process.cwd(), 'uploads', 'chat');

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        const filePath = join(uploadDir, storedName);
        await writeFile(filePath, file.buffer);

        return {
            url: `/api/chat/attachments/${storedName}`,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        };
    }

    private mimeToExt(mime: string): string {
        const map: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'application/pdf': '.pdf',
        };
        return map[mime] || '';
    }
}
