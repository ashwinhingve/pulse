import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ConfigService } from '@nestjs/config';
import { MessageStatus } from './entities/message.entity';

function socket(userId: string) {
    return { data: { userId, tokenExpires: Math.floor(Date.now() / 1000) + 900 }, emit: jest.fn(), leave: jest.fn() };
}
test('existing sockets lose message delivery when account access is revoked', async () => {
    const permitted = socket('permitted'), revoked = socket('revoked');
    const users = { findActive: jest.fn(async (id: string) => { if (id === 'revoked') throw new Error('Inactive'); }) };
    const chat = { getConversation: jest.fn().mockResolvedValue({ id: 'case-consultation' }) };
    const gateway = new ChatGateway({} as any, chat as any, {} as any, new ConfigService(), users as any);
    gateway.server = { in: () => ({ fetchSockets: async () => [permitted, revoked] }) } as any;
    await (gateway as any).broadcastConversation('case-consultation', 'new_message', { content: 'Synthetic consultation' });
    expect(permitted.emit).toHaveBeenCalledWith('new_message', { content: 'Synthetic consultation' });
    expect(revoked.emit).not.toHaveBeenCalled();
    expect(revoked.leave).toHaveBeenCalledWith('conversation:case-consultation');
});
test('message delivery rechecks current case clearance', async () => {
    const recipient = socket('lower-clearance');
    const chat = { getConversation: jest.fn().mockRejectedValue(new Error('Insufficient clearance')) };
    const gateway = new ChatGateway({} as any, chat as any, {} as any, new ConfigService(), { findActive: jest.fn() } as any);
    gateway.server = { in: () => ({ fetchSockets: async () => [recipient] }) } as any;
    await (gateway as any).broadcastConversation('classified-case', 'new_message', {});
    expect(recipient.emit).not.toHaveBeenCalled();
});
test('non-participants cannot update conversation message status', async () => {
    const service = Object.create(ChatService.prototype) as any;
    service.getConversation = jest.fn().mockRejectedValue(new Error('Not a participant'));
    service.messageRepository = { createQueryBuilder: jest.fn() };
    await expect(service.updateMessageStatus('conversation', 'outsider', MessageStatus.SENT, MessageStatus.DELIVERED)).rejects.toThrow('Not a participant');
    expect(service.messageRepository.createQueryBuilder).not.toHaveBeenCalled();
});
