// User Roles
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

export const CLEARANCE_NAMES: Record<ClearanceLevel, string> = {
    [ClearanceLevel.UNCLASSIFIED]: 'UNCLASSIFIED',
    [ClearanceLevel.CONFIDENTIAL]: 'CONFIDENTIAL',
    [ClearanceLevel.SECRET]: 'SECRET',
    [ClearanceLevel.TOP_SECRET]: 'TOP SECRET',
};

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
    [UserRole.ARMY_MEDICAL_OFFICER]: 'Army Medical Officer',
    [UserRole.PUBLIC_MEDICAL_OFFICIAL]: 'Public Medical Official',
    [UserRole.ADMIN]: 'System Administrator',
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
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

// User Types
export interface User {
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
        specialization?: string;
        unit?: string;
    };
    isActive: boolean;
    mfaEnabled: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Chat Types
export enum ConversationType {
    USER_TO_USER = 'user_to_user',
    USER_TO_AI = 'user_to_ai',
}

export enum MessageSender {
    USER = 'user',
    AI = 'ai',
    SYSTEM = 'system',
}

export enum MessageStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed',
}

export interface Conversation {
    id: string;
    type: ConversationType;
    title?: string;
    participant1Id?: string;
    participant1?: User;
    participant2Id?: string;
    participant2?: User;
    userId?: string;
    user?: User;
    aiModel?: string;
    metadata?: {
        caseId?: string;
        context?: string;
        lastMessagePreview?: string;
    };
    isActive: boolean;
    lastMessageAt?: string;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId?: string;
    sender?: User;
    senderType: MessageSender;
    content: string;
    isEncrypted: boolean;
    status: MessageStatus;
    metadata?: {
        attachments?: string[];
        replyToId?: string;
        aiModel?: string;
        tokens?: number;
        anonymized?: boolean;
    };
    readAt?: string;
    createdAt: string;
}

// Chat Partner for starting new conversations
export interface ChatPartner {
    id: string;
    username: string;
    fullName?: string;
    role: UserRole;
    department?: string;
    isOnline?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Medical Case Types
export enum CaseSeverity {
    ROUTINE = 'routine',
    URGENT = 'urgent',
    CRITICAL = 'critical',
}

export enum CaseStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    PENDING = 'pending',
    CLOSED = 'closed',
}

export interface MedicalCase {
    id: string;
    patientCode: string;
    severity: CaseSeverity;
    status: CaseStatus;
    chiefComplaint: string;
    symptoms?: string;
    vitals?: {
        temp?: number;
        bp?: string;
        hr?: number;
        rr?: number;
        spo2?: number;
    };
    medicalHistory?: string;
    assessment?: string;
    clearanceRequired: ClearanceLevel;
    isClassified: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// Patient Types
export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
}

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender: Gender;
    bloodGroup?: string;
    phone?: string;
    email?: string;
    address?: string;
    emergencyContact?: string;
    medicalHistory?: string;
    allergies?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// Doctor Types
export interface Doctor {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
    licenseNumber?: string;
    department?: string;
    phone?: string;
    email?: string;
    qualification?: string;
    experienceYears: number;
    isAvailable: boolean;
    userId?: string;
    createdAt: string;
    updatedAt: string;
}

// Symptom Types
export enum SymptomSeverity {
    MILD = 'mild',
    MODERATE = 'moderate',
    SEVERE = 'severe',
}

export interface Symptom {
    id: string;
    name: string;
    description?: string;
    severity: SymptomSeverity;
    bodyArea?: string;
    duration?: string;
    patientId: string;
    patient?: Patient;
    reportedBy: string;
    createdAt: string;
    updatedAt: string;
}

// Diagnosis Types
export enum DiagnosisStatus {
    PRELIMINARY = 'preliminary',
    CONFIRMED = 'confirmed',
    RULED_OUT = 'ruled_out',
}

export interface Diagnosis {
    id: string;
    diseaseName: string;
    description?: string;
    icdCode?: string;
    status: DiagnosisStatus;
    notes?: string;
    patientId: string;
    patient?: Patient;
    doctorId: string;
    doctor?: Doctor;
    diagnosedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Report Types
export enum ReportType {
    LAB = 'lab',
    IMAGING = 'imaging',
    PRESCRIPTION = 'prescription',
    DISCHARGE = 'discharge',
    FOLLOWUP = 'followup',
}

export interface MedicalReport {
    id: string;
    title: string;
    type: ReportType;
    findings?: string;
    recommendations?: string;
    patientId: string;
    patient?: Patient;
    doctorId: string;
    doctor?: Doctor;
    diagnosisId?: string;
    attachments?: string[];
    createdAt: string;
    updatedAt: string;
}

