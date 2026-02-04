import { Injectable } from '@nestjs/common';

@Injectable()
export class AnonymizationService {
    private readonly piiPatterns = [
        // Names
        { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, replacement: '[NAME]' },
        // SSN
        { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
        // Phone numbers
        { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE]' },
        // Email addresses
        { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
        // Dates (MM/DD/YYYY, MM-DD-YYYY)
        { pattern: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, replacement: '[DATE]' },
        // Military ID
        { pattern: /\b[A-Z]{2}\d{7,10}\b/g, replacement: '[MIL_ID]' },
        // Medical record numbers
        { pattern: /\bMRN:?\s*\d+\b/gi, replacement: '[MRN]' },
    ];

    /**
     * Anonymize text by removing PII/PHI
     */
    anonymize(text: string): { anonymized: string; redacted: number } {
        let anonymized = text;
        let redacted = 0;

        for (const { pattern, replacement } of this.piiPatterns) {
            const matches = anonymized.match(pattern);
            if (matches) {
                redacted += matches.length;
                anonymized = anonymized.replace(pattern, replacement);
            }
        }

        return { anonymized, redacted };
    }

    /**
     * Validate that text is safe to send to AI
     */
    isSafeForAI(text: string): boolean {
        const { redacted } = this.anonymize(text);
        return redacted === 0;
    }

    /**
     * Anonymize medical data for AI processing
     */
    anonymizeMedicalData(data: {
        symptoms?: string;
        vitals?: Record<string, any>;
        notes?: string;
    }): any {
        const result: any = {};

        if (data.symptoms) {
            result.symptoms = this.anonymize(data.symptoms).anonymized;
        }

        if (data.vitals) {
            result.vitals = data.vitals; // Vitals are safe (numbers)
        }

        if (data.notes) {
            result.notes = this.anonymize(data.notes).anonymized;
        }

        return result;
    }
}
