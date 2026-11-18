import { UsersService } from './users.service';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from '../common/enums/roles.enum';

function setup() {
    const admin = { id: 'admin', role: UserRole.ADMIN, isActive: true, status: UserStatus.ACTIVE };
    const repository = { findOne: jest.fn().mockResolvedValue(admin), find: jest.fn().mockResolvedValue([admin]), save: jest.fn() };
    const manager = { query: jest.fn(), getRepository: () => repository };
    return { service: new UsersService({ manager: { transaction: (fn: any) => fn(manager) } } as any, new ConfigService()), repository, manager };
}
test('blocks self-deactivation before persisting', async () => {
    const { service, repository } = setup();
    await expect(service.update('admin', { isActive: false }, 'admin')).rejects.toThrow('own account');
    expect(repository.save).not.toHaveBeenCalled();
});
test('blocks deleting the last active admin and takes the transaction lock', async () => {
    const { service, manager, repository } = setup();
    await expect(service.remove('admin', 'other')).rejects.toThrow('active administrator');
    expect(manager.query).toHaveBeenCalledWith('SELECT pg_advisory_xact_lock(72419002)');
    expect(repository.save).not.toHaveBeenCalled();
});
