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

export const CLEARANCE_NAMES = {
    [ClearanceLevel.UNCLASSIFIED]: 'UNCLASSIFIED',
    [ClearanceLevel.CONFIDENTIAL]: 'CONFIDENTIAL',
    [ClearanceLevel.SECRET]: 'SECRET',
};
