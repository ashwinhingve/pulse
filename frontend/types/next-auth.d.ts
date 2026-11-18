import 'next-auth';
import { UserRole, ClearanceLevel } from './index';

declare module 'next-auth' {
    interface User {
        error?: string;
        mfaEnabled?: boolean;
        id: string;
        email?: string;
        name: string;
        username: string;
        fullName?: string;
        role: UserRole;
        clearanceLevel: ClearanceLevel;
        department?: string;
        metadata?: {
            rank?: string;
            serviceNumber?: string;
            title?: string;
            licenseNumber?: string;
        };
        accessToken: string;
        refreshToken?: string;
    }

    interface Session {
        error?: string;
        mfaEnabled?: boolean;
        user: {
            mfaEnabled?: boolean;
            id: string;
            email?: string;
            name: string;
            username: string;
            fullName?: string;
            role: UserRole;
            clearanceLevel: ClearanceLevel;
            department?: string;
            metadata?: {
                rank?: string;
                serviceNumber?: string;
                title?: string;
                licenseNumber?: string;
            };
        };
        accessToken: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        error?: string;
        mfaEnabled?: boolean;
        id: string;
        username: string;
        fullName?: string;
        role: UserRole;
        clearanceLevel: ClearanceLevel;
        department?: string;
        metadata?: {
            rank?: string;
            serviceNumber?: string;
            title?: string;
            licenseNumber?: string;
        };
        accessToken: string;
        refreshToken?: string;
    }
}
