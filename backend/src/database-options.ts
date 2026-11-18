import { DataSourceOptions } from 'typeorm';

export function databaseOptions(env: Record<string, string | undefined>, directory: string): DataSourceOptions {
    const sslEnabled = env.DB_SSL === 'true' || (env.DB_SSL === undefined && !!env.DATABASE_URL);
    return {
        type: 'postgres',
        ...(env.DATABASE_URL ? { url: env.DATABASE_URL } : {
            host: env.DB_HOST || 'localhost', port: Number(env.DB_PORT || 5432),
            username: env.DB_USERNAME, password: env.DB_PASSWORD, database: env.DB_DATABASE,
        }),
        ssl: sslEnabled ? { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED ? env.DB_SSL_REJECT_UNAUTHORIZED === 'true' : !env.DATABASE_URL } : false,
        synchronize: env.NODE_ENV !== 'production' && env.DB_SYNCHRONIZE === 'true',
        entities: [directory + '/**/*.entity{.ts,.js}'],
        migrations: [directory + '/migrations/*{.ts,.js}'],
    };
}
