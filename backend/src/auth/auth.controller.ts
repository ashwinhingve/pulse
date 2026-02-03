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
    @Throttle(3, 3600) // 3 attempts per hour
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
    @Throttle(5, 900) // 5 attempts per 15 minutes
    async login(@Body() loginDto: LoginDto, @Ip() ipAddress: string) {
        return this.authService.login(loginDto, ipAddress);
    }

    @Post('refresh')
    @UseGuards(JwtAuthGuard)
    async refresh(@Request() req) {
        return this.authService.refreshToken(req.user.userId);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        return this.usersService.findOne(req.user.userId);
    }

    @Post('mfa/setup')
    @UseGuards(JwtAuthGuard)
    async setupMfa(@Request() req) {
        return this.authService.setupMfa(req.user.userId);
    }

    @Post('mfa/enable')
    @UseGuards(JwtAuthGuard)
    async enableMfa(@Request() req, @Body('code') code: string) {
        await this.authService.enableMfa(req.user.userId, code);
        return { message: 'MFA enabled successfully' };
    }

    @Post('mfa/disable')
    @UseGuards(JwtAuthGuard)
    async disableMfa(@Request() req) {
        await this.authService.disableMfa(req.user.userId);
        return { message: 'MFA disabled successfully' };
    }
}
