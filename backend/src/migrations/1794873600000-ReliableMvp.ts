import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReliableMvp1794873600000 implements MigrationInterface {
    name = 'ReliableMvp1794873600000';
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "chainVersion" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "chainSequence" integer`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS audit_chain_sequence_unique ON audit_logs ("chainSequence")`);
        await queryRunner.query(`ALTER TABLE medical_cases ADD COLUMN IF NOT EXISTS "patientId" uuid`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS medical_cases_patient_id ON medical_cases ("patientId")`);
        await queryRunner.query(`ALTER TABLE medical_documents ADD COLUMN IF NOT EXISTS "analysisError" text`);
        // Existing cases deliberately remain unlinked. Never infer identity from patientCode.
    }
    async down(queryRunner: QueryRunner): Promise<void> {
        // Preserve audit hashes and explicit patient links on rollback; dropping them loses history.
        throw new Error('This additive migration retains history. Roll back application code without dropping these columns.');
    }
}
