import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notifications1794960000000 implements MigrationInterface {
    name = 'Notifications1794960000000';
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE notifications_type_enum AS ENUM ('info', 'warning', 'success', 'alert'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "userId" varchar NOT NULL, type notifications_type_enum NOT NULL DEFAULT 'info', title varchar NOT NULL, message text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, link varchar, "resourceType" varchar, "resourceId" varchar, "createdAt" timestamp NOT NULL DEFAULT now())`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS notifications_user_id ON notifications ("userId")`);
    }
    async down(): Promise<void> {
        throw new Error('Notification history is retained on application rollback.');
    }
}
