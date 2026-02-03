import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export enum UserRole {
    PUBLIC = 'public',
    MEDIC = 'medic',
    DOCTOR = 'doctor',
    ADMIN = 'admin',
}

export enum ClearanceLevel {
    UNCLASSIFIED = 0,
    CONFIDENTIAL = 1,
    SECRET = 2,
}

export interface User {
    id: string
    username: string
    role: UserRole
    clearanceLevel: ClearanceLevel
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
