import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface PatientData {
    name?: string;
    age?: number;
    location?: string;
    unit?: string;
    serviceNumber?: string;
    symptoms?: string[];
    vitals?: Record<string, any>;
    [key: string]: any;
}

export interface AnonymizedData {
    patientToken: string;
    ageRange?: string;
    region?: string;
    symptoms?: string[];
    vitals?: Record<string, any>;
    [key: string]: any;
}

@Injectable()
export class AnonymizerService {
    private tokenMap = new Map<string, string>();

    anonymize(data: PatientData): AnonymizedData {
        const patientToken = this.generateToken();

        // Store mapping for de-anonymization
        if (data.name) {
            this.tokenMap.set(patientToken, data.name);
        }

        const anonymized: AnonymizedData = {
            patientToken,
        };

        // Anonymize age to range
        if (data.age !== undefined) {
            anonymized.ageRange = this.anonymizeAge(data.age);
        }

        // Anonymize location to region
        if (data.location) {
            anonymized.region = this.anonymizeLocation(data.location);
        }

        // Keep symptoms (no PII)
        if (data.symptoms) {
            anonymized.symptoms = data.symptoms;
        }

        // Keep vitals (no PII)
        if (data.vitals) {
            anonymized.vitals = data.vitals;
        }

        // Remove all PII fields
        const piiFields = ['name', 'unit', 'serviceNumber', 'ssn', 'email', 'phone'];
        Object.keys(data).forEach((key) => {
            if (!piiFields.includes(key) && !['age', 'location', 'symptoms', 'vitals'].includes(key)) {
                anonymized[key] = data[key];
            }
        });

        return anonymized;
    }

    deanonymize(token: string): string | undefined {
        return this.tokenMap.get(token);
    }

    private generateToken(): string {
        return `PT-${uuidv4().slice(0, 8)}`;
    }

    private anonymizeAge(age: number): string {
        const bucket = Math.floor(age / 5) * 5;
        return `${bucket}-${bucket + 4}`;
    }

    private anonymizeLocation(location: string): string {
        // Simple region mapping (can be expanded)
        const regionMap: Record<string, string> = {
            'fort bragg': 'Southeast US',
            'fort hood': 'South Central US',
            'fort campbell': 'Southeast US',
            'fort benning': 'Southeast US',
            'fort lewis': 'Northwest US',
            'fort carson': 'Mountain West US',
        };

        const normalized = location.toLowerCase();
        for (const [key, region] of Object.entries(regionMap)) {
            if (normalized.includes(key)) {
                return region;
            }
        }

        return 'US Military Installation';
    }

    clearTokenMap(): void {
        this.tokenMap.clear();
    }
}
