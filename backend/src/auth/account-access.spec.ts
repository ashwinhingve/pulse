import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '../common/enums/roles.enum';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

const account = { id: 'user', username: 'medic', isActive: true, status: UserStatus.ACTIVE, role: UserRole.PUBLIC_MEDICAL_OFFICIAL, clearanceLevel: 0 };
describe('current account access', () => {
    test.each([null, { ...account, isActive: false }, { ...account, status: UserStatus.PENDING }, { ...account, status: UserStatus.SUSPENDED }])('rejects missing or inactive accounts', async user => {
        const service = new UsersService({ findOne: jest.fn().mockResolvedValue(user) } as any, new ConfigService());
        await expect(service.findActive('user')).rejects.toBeInstanceOf(UnauthorizedException);
    });
    test.each([JwtStrategy, JwtRefreshStrategy])('uses current role and clearance instead of token claims', async Strategy => {
        const users = { findActive: jest.fn().mockResolvedValue(account) };
        const strategy = new Strategy(new ConfigService({ JWT_SECRET: 'test-access-secret', JWT_REFRESH_SECRET: 'test-refresh-secret' }), users as any);
        expect(await strategy.validate({ sub: 'user', username: 'old-name', role: UserRole.ADMIN, clearance: 3 })).toMatchObject({ role: UserRole.PUBLIC_MEDICAL_OFFICIAL, clearanceLevel: 0, username: 'medic' });
    });
});
