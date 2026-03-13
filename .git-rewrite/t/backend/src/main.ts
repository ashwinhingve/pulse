import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

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
                    connectSrc: ["'self'", 'http://localhost:3000', 'ws://localhost:3000', 'http://localhost:3001', 'ws://localhost:3001'],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            // Disable crossOriginResourcePolicy so CORS works for API responses
            crossOriginResourcePolicy: { policy: 'cross-origin' },
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

    // Health check endpoint (outside global prefix, for Railway/monitoring)
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get('/health', (_req: any, res: any) => {
        res.json({ status: 'ok', service: 'PulseLogic API', timestamp: new Date().toISOString() });
    });

    // API prefix
    app.setGlobalPrefix(apiPrefix);

    // Listen on all interfaces so Android emulator can connect
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 PulseLogic Backend running on: http://0.0.0.0:${port}/${apiPrefix}`);
    console.log(`🔒 Security: Helmet enabled, CORS: ${corsOrigin}`);
}

bootstrap();
