import { databaseOptions } from './database-options';

describe('database configuration', () => {
    it('never synchronizes a production database, including a hosted URL', () => {
        expect(databaseOptions({ NODE_ENV: 'production', DATABASE_URL: 'postgres://example', DB_SYNCHRONIZE: 'true' }, '/app').synchronize).toBe(false);
    });
    it('allows explicit development initialization', () => {
        expect(databaseOptions({ NODE_ENV: 'development', DB_SYNCHRONIZE: 'true' }, '/app').synchronize).toBe(true);
    });
    it('defaults to migrations and preserves existing hosted TLS compatibility', () => {
        const options = databaseOptions({ DATABASE_URL: 'postgres://example' }, '/app');
        expect(options.synchronize).toBe(false);
        expect(options).toMatchObject({ ssl: { rejectUnauthorized: false } });
        expect(databaseOptions({ DATABASE_URL: 'postgres://example', DB_SSL_REJECT_UNAUTHORIZED: 'true' }, '/app')).toMatchObject({ ssl: { rejectUnauthorized: true } });
    });
    it('respects explicit TLS settings for private networks and custom certificates', () => {
        expect(databaseOptions({ DATABASE_URL: 'postgres://example', DB_SSL: 'false' }, '/app')).toMatchObject({ ssl: false });
        expect(databaseOptions({ DB_SSL: 'true', DB_SSL_REJECT_UNAUTHORIZED: 'false' }, '/app')).toMatchObject({ ssl: { rejectUnauthorized: false } });
    });
});
