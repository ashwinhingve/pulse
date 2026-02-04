import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
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

        const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
        const passwordHash = await bcrypt.hash(createUserDto.password, bcryptRounds);

        const user = this.usersRepository.create({
            ...createUserDto,
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
            const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, bcryptRounds);
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
}
