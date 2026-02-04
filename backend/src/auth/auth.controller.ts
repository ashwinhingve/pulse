import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    Get,
    HttpCode,
    HttpStatus,
    Ip,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService,
    ) { }

    @Post('register')
    @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 attempts per hour
    async register(@Body() createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);
        return {
            id: user.id,
            username: user.username,
            role: user.role,
            clearance: user.clearanceLevel,
        };
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
    async login(@Body() loginDto: LoginDto, @Ip() ipAddress: string) {
        return this.authService.login(loginDto, ipAddress);
    }

    @Post('refresh')
    @UseGuards(JwtAuthGuard)
    async refresh(@Request() req: any) {
        return this.authService.refreshToken(req.user.userId);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req: any) {
        return this.usersService.findOne(req.user.userId);
    }

    @Post('mfa/setup')
    @UseGuards(JwtAuthGuard)
    async setupMfa(@Request() req: any) {
        return this.authService.setupMfa(req.user.userId);
    }

    @Post('mfa/enable')
    @UseGuards(JwtAuthGuard)
    async enableMfa(@Request() req: any, @Body('code') code: string) {
        await this.authService.enableMfa(req.user.userId, code);
        return { message: 'MFA enabled successfully' };
    }

    @Post('mfa/disable')
    @UseGuards(JwtAuthGuard)
    async disableMfa(@Request() req: any) {
        await this.authService.disableMfa(req.user.userId);
        return { message: 'MFA disabled successfully' };
    }
}
