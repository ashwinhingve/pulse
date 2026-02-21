import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { AiModule } from './ai/ai.module';
import { ChatModule } from './chat/chat.module';
import { MedicalModule } from './medical/medical.module';
import { DemoModule } from './demo/demo.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { SymptomsModule } from './symptoms/symptoms.module';
import { DiagnosesModule } from './diagnoses/diagnoses.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditInterceptor } from './audit/interceptors/audit.interceptor';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Database - supports both DATABASE_URL (Railway) and individual vars
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const databaseUrl = configService.get('DATABASE_URL');

                if (databaseUrl) {
                    // Railway provides DATABASE_URL
                    return {
                        type: 'postgres',
                        url: databaseUrl,
                        entities: [__dirname + '/**/*.entity{.ts,.js}'],
                        synchronize: true,
                        ssl: { rejectUnauthorized: false },
                    };
                }

                // Local development with individual vars
                return {
                    type: 'postgres',
                    host: configService.get('DB_HOST'),
                    port: configService.get('DB_PORT'),
                    username: configService.get('DB_USERNAME'),
                    password: configService.get('DB_PASSWORD'),
                    database: configService.get('DB_DATABASE'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
                    logging: configService.get('NODE_ENV') === 'development',
                    ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
                };
            },
            inject: [ConfigService],
        }),

        // Rate limiting
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ([{
                ttl: configService.get('RATE_LIMIT_TTL', 60),
                limit: configService.get('RATE_LIMIT_MAX', 100),
            }]),
            inject: [ConfigService],
        }),

        // Feature modules
        AuthModule,
        UsersModule,
        AuditModule,
        AiModule,
        ChatModule,
        MedicalModule,
        DemoModule,
        PatientsModule,
        DoctorsModule,
        SymptomsModule,
        DiagnosesModule,
        ReportsModule,
        DashboardModule,
    ],
    providers: [
        // Global audit interceptor
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditInterceptor,
        },
    ],
})
export class AppModule { }
