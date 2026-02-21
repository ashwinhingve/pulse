export enum UserStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
}

export enum UserRole {
    // Core roles
    ARMY_MEDICAL_OFFICER = 'army_medical_officer',
    PUBLIC_MEDICAL_OFFICIAL = 'public_medical_official',
    ADMIN = 'admin',
}

export enum ClearanceLevel {
    UNCLASSIFIED = 0,      // Public information
    CONFIDENTIAL = 1,       // Limited distribution
    SECRET = 2,             // Restricted access
    TOP_SECRET = 3,         // Highly restricted
}

export const CLEARANCE_NAMES = {
    [ClearanceLevel.UNCLASSIFIED]: 'UNCLASSIFIED',
    [ClearanceLevel.CONFIDENTIAL]: 'CONFIDENTIAL',
    [ClearanceLevel.SECRET]: 'SECRET',
    [ClearanceLevel.TOP_SECRET]: 'TOP SECRET',
};

// Role-based permissions
export const ROLE_PERMISSIONS = {
    [UserRole.ARMY_MEDICAL_OFFICER]: {
        canAccessMilitaryCases: true,
        canAccessPublicCases: true,
        canChatWithPublicOfficials: true,
        canChatWithArmyOfficers: false, // Can't chat with same role
        canChatWithAdmins: false,
        canChatWithAI: true,
        canViewClassifiedData: true,
        canCreateCases: true,
        canApproveTreatments: true,
        canRequestEvacuation: true,
        canManageUsers: false,
        canViewAuditLogs: false,
        maxClearance: ClearanceLevel.SECRET,
    },
    [UserRole.PUBLIC_MEDICAL_OFFICIAL]: {
        canAccessMilitaryCases: false,
        canAccessPublicCases: true,
        canChatWithPublicOfficials: false, // Can't chat with same role
        canChatWithArmyOfficers: true,
        canChatWithAdmins: false,
        canChatWithAI: true,
        canViewClassifiedData: false,
        canCreateCases: true,
        canApproveTreatments: true,
        canRequestEvacuation: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        maxClearance: ClearanceLevel.CONFIDENTIAL,
    },
    [UserRole.ADMIN]: {
        canAccessMilitaryCases: true,
        canAccessPublicCases: true,
        canChatWithPublicOfficials: true,
        canChatWithArmyOfficers: true,
        canChatWithAdmins: true, // Admin can chat with everyone
        canChatWithAI: true,
        canViewClassifiedData: true,
        canCreateCases: true,
        canApproveTreatments: true,
        canRequestEvacuation: true,
        canManageUsers: true,
        canViewAuditLogs: true,
        maxClearance: ClearanceLevel.TOP_SECRET,
    },
};

// Role display names
export const ROLE_DISPLAY_NAMES = {
    [UserRole.ARMY_MEDICAL_OFFICER]: 'Army Medical Officer',
    [UserRole.PUBLIC_MEDICAL_OFFICIAL]: 'Public Medical Official',
    [UserRole.ADMIN]: 'System Administrator',
};

// Role badges/colors
export const ROLE_COLORS = {
    [UserRole.ARMY_MEDICAL_OFFICER]: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-500',
    },
    [UserRole.PUBLIC_MEDICAL_OFFICIAL]: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-500',
    },
    [UserRole.ADMIN]: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-500',
    },
};
