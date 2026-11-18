import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { auditHash, verifyAuditChain } from './integrity';
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
        return this.auditLogRepository.manager.transaction(async manager => {
            // Serializes appends across processes, not just this Node instance.
            await manager.query('SELECT pg_advisory_xact_lock(72419001)');
            const repository = manager.getRepository(AuditLog);
            const previous = await repository.findOne({ where: { chainVersion: 2 }, order: { chainSequence: 'DESC' } });
            const log = repository.create({
                id: randomUUID(), timestamp: new Date(), chainVersion: 2,
                chainSequence: (previous?.chainSequence ?? 0) + 1,
                previousHash: previous?.currentHash ?? '0',
                action: data.action, userId: data.userId, username: data.username,
                resource: data.resource, resourceId: data.resourceId, ipAddress: data.ipAddress || 'unknown',
                userAgent: data.userAgent, deviceId: data.deviceId, success: data.success,
                errorMessage: data.errorMessage || data.error,
                metadata: data.metadata,
            });
            log.currentHash = auditHash(log);
            return repository.save(log);
        });
    }

    async findAll(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            order: { timestamp: 'DESC' },
            take: limit,
            skip: offset,
        });
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

    async verifyIntegrity() {
        return verifyAuditChain(await this.auditLogRepository.find());
    }
}
