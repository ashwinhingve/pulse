import { auditHash, verifyAuditChain } from './integrity';
import { AuditLog } from './audit-log.entity';

function entry(sequence: number, previousHash = '0'): AuditLog {
    const log = { id: `entry-${sequence}`, timestamp: new Date('2026-01-01T00:00:00Z'),
        action: 'GET /api/patients', ipAddress: '127.0.0.1', success: true,
        chainVersion: 2, chainSequence: sequence, previousHash, metadata: { b: 2, a: 1 } } as unknown as AuditLog;
    log.currentHash = auditHash(log);
    return log;
}

describe('audit chain verification', () => {
    test('verifies persisted data regardless of JSON key order', () => {
        const first = entry(1); const second = entry(2, first.currentHash);
        second.metadata = { a: 1, b: 2 };
        expect(verifyAuditChain([second, first]).intact).toBe(true);
    });
    test('detects modification of the first entry', () => {
        const first = entry(1); first.action = 'changed';
        expect(verifyAuditChain([first]).intact).toBe(false);
    });
    test('detects a missing middle entry', () => {
        const first = entry(1); const second = entry(2, first.currentHash); const third = entry(3, second.currentHash);
        expect(verifyAuditChain([first, third]).intact).toBe(false);
    });
    test('reports legacy entries without rewriting them', () => {
        const result = verifyAuditChain([{ ...entry(1), chainVersion: 1 }, entry(1)]);
        expect(result).toMatchObject({ intact: false, currentChainIntact: true, legacyCount: 1 });
    });
});
