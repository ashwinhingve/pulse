import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { AuditService } from '../audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    private readonly logger = new Logger(AuditInterceptor.name);
    constructor(private readonly auditService: AuditService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const started = Date.now();
        const record = async (success: boolean, error?: any) => {
            const path = request.path || request.url.split('?')[0];
            const parts = path.split('/').filter(Boolean);
            try {
                await this.auditService.log({
                    userId: request.user?.id, username: request.user?.username,
                    action: `${request.method} ${path}`, resource: parts[1],
                    resourceId: request.params?.id || request.params?.userId,
                    ipAddress: request.ip || 'unknown', userAgent: request.headers['user-agent'],
                    success, errorMessage: error ? `Request failed (${error.status || 500})` : undefined,
                    metadata: { durationMs: Date.now() - started },
                });
            } catch { this.logger.error('Audit append failed'); }
        };
        return next.handle().pipe(
            mergeMap(response => from(record(true).then(() => response))),
            catchError(error => from(record(false, error).then(() => { throw error; }))),
        );
    }
}
