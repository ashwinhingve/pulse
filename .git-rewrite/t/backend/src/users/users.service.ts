import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
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

    async findByUsername(username: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { username, deletedAt: IsNull() },
        });
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);

        if (updateUserDto.password) {
            const bcryptRounds = parseInt(this.configService.get('BCRYPT_ROUNDS', '12'), 10);
            (updateUserDto as any).passwordHash = await bcrypt.hash(updateUserDto.password, bcryptRounds);
            delete updateUserDto.password;
        }

        Object.assign(user, updateUserDto);
        return this.usersRepository.save(user);
    }

    async remove(id: string): Promise<void> {
        const user = await this.findOne(id);
        user.deletedAt = new Date();
        await this.usersRepository.save(user);
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
