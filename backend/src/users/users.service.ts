import { paginatedList, ListQuery } from '../common/pagination';
import { Injectable, NotFoundException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { UserRole, ClearanceLevel, UserStatus } from '../common/enums/roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private configService: ConfigService,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.usersRepository.findOne({
            where: { username: createUserDto.username },
        });

        if (existingUser) {
            throw new ConflictException('Username already exists');
        }

        const bcryptRounds = parseInt(this.configService.get('BCRYPT_ROUNDS', '12'), 10);
        const { password, ...rest } = createUserDto;
        const passwordHash = await bcrypt.hash(password, bcryptRounds);

        const user = this.usersRepository.create({
            ...rest,
            passwordHash,
        });

        return this.usersRepository.save(user);
    }

    async summary() {
        const [total, active] = await Promise.all([
            this.usersRepository.count({ where: { deletedAt: IsNull() } }),
            this.usersRepository.count({ where: { deletedAt: IsNull(), isActive: true, status: UserStatus.ACTIVE } }),
        ]);
        return { total, active };
    }

    findPage(query: ListQuery) {
        return paginatedList(this.usersRepository, query, ['username', 'fullName', 'department'], []);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find({
            where: { deletedAt: IsNull() },
        });
    }

    async findOne(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findActive(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id, deletedAt: IsNull() } });
        if (!user || !user.isActive || user.status !== UserStatus.ACTIVE) {
            throw new UnauthorizedException('Account is not active');
        }
        return user;
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { username, deletedAt: IsNull() },
        });
    }

    async update(id: string, dto: UpdateUserDto, actorId?: string): Promise<User> {
        return this.usersRepository.manager.transaction(async manager => {
            await manager.query('SELECT pg_advisory_xact_lock(72419002)');
            const repository = manager.getRepository(User);
            const user = await repository.findOne({ where: { id, deletedAt: IsNull() } });
            if (!user) throw new NotFoundException('User not found');
            const changes = { ...dto };
            if (changes.isActive !== undefined) {
                if (user.status === UserStatus.PENDING) throw new ForbiddenException('Use approval to activate a pending account');
                changes.status = changes.isActive ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
            } else if (changes.status !== undefined) {
                if (changes.status === UserStatus.PENDING || user.status === UserStatus.PENDING) {
                    throw new ForbiddenException('Use the pending approval workflow');
                }
                changes.isActive = changes.status === UserStatus.ACTIVE;
            }
            const removesAdmin = user.role === UserRole.ADMIN && user.isActive &&
                (changes.isActive === false || (changes.role !== undefined && changes.role !== UserRole.ADMIN));
            if (actorId === id && (changes.isActive === false || removesAdmin)) {
                throw new ForbiddenException('You cannot deactivate or demote your own account');
            }
            if (removesAdmin) await this.requireAnotherAdmin(repository, id);
            if (changes.password) {
                user.passwordHash = await bcrypt.hash(changes.password, parseInt(this.configService.get('BCRYPT_ROUNDS', '12'), 10));
                delete changes.password;
            }
            Object.assign(user, changes);
            return repository.save(user);
        });
    }

    private async requireAnotherAdmin(repository: Repository<User>, id: string): Promise<void> {
        const admins = await repository.find({ where: { role: UserRole.ADMIN, isActive: true,
            status: UserStatus.ACTIVE, deletedAt: IsNull() } });
        if (!admins.some(admin => admin.id !== id)) throw new ForbiddenException('At least one active administrator must remain');
    }

    async remove(id: string, actorId?: string): Promise<void> {
        if (id === actorId) throw new ForbiddenException('You cannot delete your own account');
        await this.usersRepository.manager.transaction(async manager => {
            await manager.query('SELECT pg_advisory_xact_lock(72419002)');
            const repository = manager.getRepository(User);
            const user = await repository.findOne({ where: { id, deletedAt: IsNull() } });
            if (!user) throw new NotFoundException('User not found');
            if (user.role === UserRole.ADMIN && user.isActive) await this.requireAnotherAdmin(repository, id);
            user.deletedAt = new Date();
            user.isActive = false;
            user.status = UserStatus.SUSPENDED;
            await repository.save(user);
        });
    }

    async validatePassword(user: User, password: string): Promise<boolean> {
        return bcrypt.compare(password, user.passwordHash);
    }

    async updateLastLogin(userId: string, ipAddress: string): Promise<void> {
        await this.usersRepository.update(userId, {
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
        });
    }

    async findPending(): Promise<User[]> {
        return this.usersRepository.find({
            where: { status: UserStatus.PENDING, deletedAt: IsNull() },
            order: { createdAt: 'ASC' },
        });
    }

    async approveUser(
        id: string,
        role: UserRole,
        clearanceLevel: ClearanceLevel,
    ): Promise<User> {
        const user = await this.findOne(id);
        if (user.status !== UserStatus.PENDING) {
            throw new ForbiddenException('User is not in pending state');
        }
        user.status = UserStatus.ACTIVE;
        user.isActive = true;
        user.role = role;
        user.clearanceLevel = clearanceLevel;
        return this.usersRepository.save(user);
    }

    async rejectUser(id: string): Promise<void> {
        const user = await this.findOne(id);
        if (user.status !== UserStatus.PENDING) {
            throw new ForbiddenException('User is not in pending state');
        }
        // Soft-delete the rejected registration
        user.deletedAt = new Date();
        await this.usersRepository.save(user);
    }
}
