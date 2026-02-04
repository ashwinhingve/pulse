import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DemoService } from './demo/demo.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3001);
    const apiPrefix = configService.get<string>('API_PREFIX', 'api');
    const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');

    // Security headers
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            referrerPolicy: { policy: 'no-referrer' },
            noSniff: true,
            xssFilter: true,
            hidePoweredBy: true,
        }),
    );

    // CORS configuration - allow mobile apps from any origin
    app.enableCors({
        origin: true, // Allow all origins (needed for mobile apps)
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // API prefix
    app.setGlobalPrefix(apiPrefix);

    // Auto-seed demo data (for demo deployment)
    try {
        const demoService = app.get(DemoService);
        await demoService.seedDemoData();
    } catch (error) {
        console.log('⚠️ Demo seeding skipped (may already exist)');
    }

    // Listen on all interfaces so Android emulator can connect
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 PulseLogic Backend running on: http://0.0.0.0:${port}/${apiPrefix}`);
    console.log(`🔒 Security: Helmet enabled, CORS: ${corsOrigin}`);
    console.log(`📋 Demo users: dr.smith, medic.jones, spec.wilson, admin (Password: Demo123!)`);
}

bootstrap();
