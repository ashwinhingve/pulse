import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class MfaService {
    /**
     * Generate MFA secret for user
     */
    generateSecret(username: string): {
        secret: string;
        otpauthUrl: string;
    } {
        const secret = speakeasy.generateSecret({
            name: `PulseLogic (${username})`,
            issuer: 'PulseLogic Military Medical',
            length: 32,
        });

        return {
            secret: secret.base32 || '',
            otpauthUrl: secret.otpauth_url || '',
        };
    }

    /**
     * Generate QR code for MFA setup
     */
    async generateQRCode(otpauthUrl: string): Promise<string> {
        return QRCode.toDataURL(otpauthUrl);
    }

    /**
     * Verify MFA token
     */
    verifyToken(secret: string, token: string): boolean {
        return speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2, // Allow 2 time steps before/after for clock drift
        });
    }

    /**
     * Generate backup codes
     */
    generateBackupCodes(count: number = 10): string[] {
        const codes: string[] = [];

        for (let i = 0; i < count; i++) {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            codes.push(code);
        }

        return codes;
    }
}
