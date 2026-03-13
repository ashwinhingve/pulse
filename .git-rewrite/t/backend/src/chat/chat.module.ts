import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatFileService } from './chat-file.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { AuditModule } from '../audit/audit.module';
import { AiModule } from '../ai/ai.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Conversation, Message, User]),
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (cs: ConfigService) => ({
                secret: cs.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: cs.get<string>('JWT_EXPIRATION', '15m'),
                },
            }),
            inject: [ConfigService],
        }),
        AuditModule,
        AiModule,
        UsersModule,
    ],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService, ChatFileService],
    exports: [ChatService],
})
export class ChatModule {}
