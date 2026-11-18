import { createHash } from 'crypto';
import { AuditLog } from './audit-log.entity';

function canonical(value: any): any {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') return Object.fromEntries(
        Object.keys(value).sort().map(key => [key, canonical(value[key])]),
    );
    return value;
}

export function auditHash(log: Partial<AuditLog>): string {
    const fields = ['id', 'timestamp', 'userId', 'username', 'action', 'resource', 'resourceId',
        'ipAddress', 'userAgent', 'deviceId', 'success', 'errorMessage', 'metadata',
        'previousHash', 'chainVersion', 'chainSequence'] as const;
    const data = Object.fromEntries(fields.map(key => [key, log[key] ?? null]));
    return createHash('sha256').update(JSON.stringify(canonical(data))).digest('hex');
}

export function verifyAuditChain(logs: AuditLog[]) {
    const legacyCount = logs.filter(log => log.chainVersion !== 2).length;
    const current = logs.filter(log => log.chainVersion === 2).sort((a, b) => a.chainSequence - b.chainSequence);
    let previousHash = '0';
    let sequence = 1;
    for (const log of current) {
        if (log.chainSequence !== sequence || log.previousHash !== previousHash || auditHash(log) !== log.currentHash) {
            return { intact: false, currentChainIntact: false, verifiedEntries: sequence - 1, legacyCount,
                message: 'The current audit chain contains a missing or modified entry.' };
        }
        previousHash = log.currentHash;
        sequence++;
    }
    return { intact: legacyCount === 0, currentChainIntact: true, verifiedEntries: current.length, legacyCount,
        message: legacyCount ? 'Current chain verified. Legacy entries cannot be verified by this format.' : 'Current chain verified.' };
}
