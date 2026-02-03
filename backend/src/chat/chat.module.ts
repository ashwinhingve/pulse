import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [AuditModule],
    providers: [ChatGateway],
})
export class ChatModule { }
