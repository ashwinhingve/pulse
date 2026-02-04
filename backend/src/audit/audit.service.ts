import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { AuditLog } from './audit-log.entity';

export interface AuditLogData {
    action: string;
    userId?: string;
    username?: string;
    resource?: string;
    resourceId?: string;
    ipAddress: string;
    userAgent?: string;
    deviceId?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
    details?: any; // For additional request/response data
    duration?: number; // Request duration in ms
    error?: string; // Error message if failed
}

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    async log(data: AuditLogData): Promise<AuditLog> {
        // Get previous log for hash chain
        const previousLogs = await this.auditLogRepository.find({
            order: { timestamp: 'DESC' },
            take: 1,
        });

        const previousLog = previousLogs[0];
        const previousHash = previousLog?.currentHash || '0';

        // Create hash of current log
        const currentHash = this.createHash({
            ...data,
            previousHash,
            timestamp: new Date(),
        });

        const auditLog = this.auditLogRepository.create({
            ...data,
            previousHash,
            currentHash,
        });

        return this.auditLogRepository.save(auditLog);
    }

    async findByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            where: { userId },
            order: { timestamp: 'DESC' },
            take: limit,
        });
    }

    async findByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            where: { action },
            order: { timestamp: 'DESC' },
            take: limit,
        });
    }

    async verifyIntegrity(): Promise<boolean> {
        const logs = await this.auditLogRepository.find({
            order: { timestamp: 'ASC' },
        });

        for (let i = 1; i < logs.length; i++) {
            const currentLog = logs[i];
            const previousLog = logs[i - 1];

            if (currentLog.previousHash !== previousLog.currentHash) {
                return false;
            }

            const expectedHash = this.createHash({
                action: currentLog.action,
                userId: currentLog.userId,
                username: currentLog.username,
                resource: currentLog.resource,
                resourceId: currentLog.resourceId,
                ipAddress: currentLog.ipAddress,
                userAgent: currentLog.userAgent,
                deviceId: currentLog.deviceId,
                success: currentLog.success,
                errorMessage: currentLog.errorMessage,
                metadata: currentLog.metadata,
                previousHash: currentLog.previousHash,
                timestamp: currentLog.timestamp,
            });

            if (currentLog.currentHash !== expectedHash) {
                return false;
            }
        }

        return true;
    }

    private createHash(data: any): string {
        const hash = createHash('sha256');
        hash.update(JSON.stringify(data));
        return hash.digest('hex');
    }
}
