import 'next-auth';
import { UserRole, ClearanceLevel } from './index';

declare module 'next-auth' {
    interface User {
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
        user: {
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
