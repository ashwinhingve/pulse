import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
    sub: string;
    username: string;
    role: string;
    clearance: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private auditService: AuditService,
    ) { }

    async validateUser(username: string, password: string): Promise<User | null> {
        const user = await this.usersService.findByUsername(username);

        if (!user || !user.isActive) {
            return null;
        }

        const isPasswordValid = await this.usersService.validatePassword(user, password);

        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    async login(loginDto: LoginDto, ipAddress: string): Promise<AuthTokens> {
        const user = await this.validateUser(loginDto.username, loginDto.password);

        if (!user) {
            await this.auditService.log({
                action: 'login_failed',
                userId: null,
                username: loginDto.username,
                ipAddress,
                success: false,
                errorMessage: 'Invalid credentials',
            });
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check MFA if enabled
        if (user.mfaEnabled) {
            if (!loginDto.mfaCode) {
                throw new UnauthorizedException('MFA code required');
            }

            const isMfaValid = this.verifyMfaCode(user.mfaSecret, loginDto.mfaCode);

            if (!isMfaValid) {
                await this.auditService.log({
                    action: 'login_failed_mfa',
                    userId: user.id,
                    username: user.username,
                    ipAddress,
                    success: false,
                    errorMessage: 'Invalid MFA code',
                });
                throw new UnauthorizedException('Invalid MFA code');
            }
        }

        // Update last login
        await this.usersService.updateLastLogin(user.id, ipAddress);

        // Generate tokens
        const tokens = await this.generateTokens(user);

        // Log successful login
        await this.auditService.log({
            action: 'login_success',
            userId: user.id,
            username: user.username,
            ipAddress,
            success: true,
        });

        return tokens;
    }

    async generateTokens(user: User): Promise<AuthTokens> {
        const payload: JwtPayload = {
            sub: user.id,
            username: user.username,
            role: user.role,
            clearance: user.clearanceLevel,
        };

        const accessToken = this.jwtService.sign(payload);

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    async refreshToken(userId: string): Promise<AuthTokens> {
        const user = await this.usersService.findOne(userId);
        return this.generateTokens(user);
    }

    async setupMfa(userId: string): Promise<{ secret: string; qrCode: string }> {
        const user = await this.usersService.findOne(userId);

        const secret = speakeasy.generateSecret({
            name: `PulseLogic (${user.username})`,
            length: 32,
        });

        // Save secret to user
        await this.usersService.update(userId, {
            mfaSecret: secret.base32,
        });

        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        return {
            secret: secret.base32,
            qrCode,
        };
    }

    async enableMfa(userId: string, code: string): Promise<void> {
        const user = await this.usersService.findOne(userId);

        if (!user.mfaSecret) {
            throw new UnauthorizedException('MFA not set up');
        }

        const isValid = this.verifyMfaCode(user.mfaSecret, code);

        if (!isValid) {
            throw new UnauthorizedException('Invalid MFA code');
        }

        await this.usersService.update(userId, {
            mfaEnabled: true,
        });
    }

    async disableMfa(userId: string): Promise<void> {
        await this.usersService.update(userId, {
            mfaEnabled: false,
            mfaSecret: null,
        });
    }

    private verifyMfaCode(secret: string, code: string): boolean {
        return speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: code,
            window: 2,
        });
    }
}
