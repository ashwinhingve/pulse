import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export enum UserRole {
    ARMY_MEDICAL_OFFICER = 'army_medical_officer',
    PUBLIC_MEDICAL_OFFICIAL = 'public_medical_official',
    ADMIN = 'admin',
}

export enum ClearanceLevel {
    UNCLASSIFIED = 0,
    CONFIDENTIAL = 1,
    SECRET = 2,
    TOP_SECRET = 3,
}

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
    [UserRole.ARMY_MEDICAL_OFFICER]: 'Army Medical Officer',
    [UserRole.PUBLIC_MEDICAL_OFFICIAL]: 'Public Medical Official',
    [UserRole.ADMIN]: 'System Administrator',
};

export const CLEARANCE_NAMES: Record<ClearanceLevel, string> = {
    [ClearanceLevel.UNCLASSIFIED]: 'UNCLASSIFIED',
    [ClearanceLevel.CONFIDENTIAL]: 'CONFIDENTIAL',
    [ClearanceLevel.SECRET]: 'SECRET',
    [ClearanceLevel.TOP_SECRET]: 'TOP SECRET',
};

export const ROLE_PERMISSIONS = {
    [UserRole.ARMY_MEDICAL_OFFICER]: {
        canAccessMilitaryCases: true,
        canAccessPublicCases: true,
        canChatWithPublicOfficials: true,
        canChatWithAI: true,
        canViewClassifiedData: true,
        canCreateCases: true,
    },
    [UserRole.PUBLIC_MEDICAL_OFFICIAL]: {
        canAccessMilitaryCases: false,
        canAccessPublicCases: true,
        canChatWithArmyOfficers: true,
        canChatWithAI: true,
        canViewClassifiedData: false,
        canCreateCases: true,
    },
    [UserRole.ADMIN]: {
        canAccessMilitaryCases: true,
        canAccessPublicCases: true,
        canChatWithPublicOfficials: true,
        canChatWithArmyOfficers: true,
        canChatWithAI: true,
        canViewClassifiedData: true,
        canCreateCases: true,
        canManageUsers: true,
        canViewAuditLogs: true,
    },
};

export interface User {
    id: string
    username: string
    fullName?: string
    role: UserRole
    clearanceLevel: ClearanceLevel
    department?: string
    metadata?: {
        rank?: string
        serviceNumber?: string
        title?: string
        licenseNumber?: string
    }
    mfaEnabled: boolean
}

interface AuthState {
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    setAuth: (user: User, accessToken: string, refreshToken: string) => void
    clearAuth: () => void
    updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            setAuth: (user, accessToken, refreshToken) => {
                localStorage.setItem('accessToken', accessToken)
                localStorage.setItem('refreshToken', refreshToken)
                set({ user, accessToken, refreshToken, isAuthenticated: true })
            },

            clearAuth: () => {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
            },

            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
