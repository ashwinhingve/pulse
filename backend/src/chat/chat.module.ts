import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { AuditModule } from '../audit/audit.module';
import { AiModule } from '../ai/ai.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Conversation, Message, User]),
        AuditModule,
        AiModule,
        UsersModule,
    ],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
    exports: [ChatService],
})
export class ChatModule {}
