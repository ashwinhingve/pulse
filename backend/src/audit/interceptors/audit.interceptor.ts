import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private readonly auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { user, method, url, body, ip } = request;

        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: (response) => {
                    const duration = Date.now() - startTime;

                    // Log successful operations
                    this.auditService.log({
                        userId: user?.id,
                        action: `${method} ${url}`,
                        resource: this.extractResource(url),
                        details: this.sanitizeBody(body),
                        ipAddress: ip,
                        userAgent: request.headers['user-agent'],
                        duration,
                        success: true,
                    });
                },
                error: (error) => {
                    const duration = Date.now() - startTime;

                    // Log failed operations
                    this.auditService.log({
                        userId: user?.id,
                        action: `${method} ${url}`,
                        resource: this.extractResource(url),
                        details: this.sanitizeBody(body),
                        ipAddress: ip,
                        userAgent: request.headers['user-agent'],
                        duration,
                        success: false,
                        error: error.message,
                    });
                },
            }),
        );
    }

    private extractResource(url: string): string {
        const parts = url.split('/');
        return parts[2] || 'unknown'; // e.g., /api/patients/123 -> patients
    }

    private sanitizeBody(body: any): any {
        if (!body) return {};

        // Remove sensitive fields
        const sanitized = { ...body };
        delete sanitized.password;
        delete sanitized.mfaSecret;
        delete sanitized.token;

        return sanitized;
    }
}
