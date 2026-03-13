import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Guideline {
    id: string;
    title: string;
    category: string;
    content: string;
    keywords: string[];
    source: string;
}

export interface ScoredGuideline {
    guideline: Guideline;
    score: number;
}

// Common medical stopwords that shouldn't drive search relevance
const STOPWORDS = new Set([
    'what', 'how', 'when', 'where', 'which', 'who', 'why',
    'the', 'for', 'and', 'are', 'was', 'were', 'been', 'being',
    'have', 'has', 'had', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'must',
    'about', 'with', 'from', 'this', 'that', 'these', 'those',
    'treatment', 'manage', 'management', 'protocol', 'guidelines',
    'give', 'tell', 'explain', 'describe', 'please', 'help',
]);

@Injectable()
export class MedicalGuidelinesService implements OnModuleInit {
    private readonly logger = new Logger(MedicalGuidelinesService.name);
    private guidelines: Guideline[] = [];

    onModuleInit() {
        this.loadGuidelines();
    }

    private loadGuidelines() {
        try {
            const filePath = path.join(__dirname, 'aiims-antibiotic-guidelines.json');
            const raw = fs.readFileSync(filePath, 'utf-8');
            this.guidelines = JSON.parse(raw);
            this.logger.log(`Loaded ${this.guidelines.length} medical guidelines from AIIMS Antibiotic Policy`);
        } catch (error) {
            this.logger.error('Failed to load medical guidelines', error);
            this.guidelines = [];
        }
    }

    getAll(): Guideline[] {
        return this.guidelines;
    }

    getById(id: string): Guideline | undefined {
        return this.guidelines.find(g => g.id === id);
    }

    getByCategory(category: string): Guideline[] {
        return this.guidelines.filter(g =>
            g.category.toLowerCase().includes(category.toLowerCase()),
        );
    }

    getCategories(): string[] {
        return [...new Set(this.guidelines.map(g => g.category))];
    }

    /**
     * Search guidelines with relevance scoring.
     * Returns only results above the minimum relevance threshold.
     */
    search(query: string, minScore = 8): Guideline[] {
        const scored = this.searchWithScores(query);
        return scored
            .filter(s => s.score >= minScore)
            .slice(0, 5)
            .map(s => s.guideline);
    }

    /**
     * Search with scores exposed (for debugging / API)
     */
    searchWithScores(query: string): ScoredGuideline[] {
        const terms = query
            .toLowerCase()
            .split(/\s+/)
            .filter(t => t.length > 2 && !STOPWORDS.has(t));

        if (terms.length === 0) return [];

        const scored = this.guidelines.map(g => {
            const lowerTitle = g.title.toLowerCase();
            const lowerContent = g.content.toLowerCase();
            const lowerCategory = g.category.toLowerCase();

            let score = 0;

            // Exact title match is very strong
            if (terms.some(t => lowerTitle === t || lowerTitle.includes(t))) {
                for (const term of terms) {
                    if (lowerTitle.includes(term)) score += 15;
                }
            }

            for (const term of terms) {
                // Category match
                if (lowerCategory.includes(term)) score += 7;

                // Keyword match (these are curated, so weighted higher)
                if (g.keywords.some(k => k.includes(term))) score += 5;

                // Content matches — cap at 3 to avoid common-word inflation
                const contentMatches = (lowerContent.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
                score += Math.min(contentMatches, 3);
            }

            return { guideline: g, score };
        });

        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Build context string for AI prompts.
     * Only includes guidelines that are genuinely relevant (score >= threshold).
     */
    buildContextForQuery(query: string): string {
        const relevant = this.search(query, 10);
        if (relevant.length === 0) {
            return '';
        }

        const contextParts = relevant.slice(0, 3).map(g =>
            `[${g.title} (${g.category})]\n${g.content.substring(0, 1500)}`,
        );

        return `\n\n--- AIIMS Antibiotic Policy Guidelines (Relevant Sections) ---\n${contextParts.join('\n\n')}\n--- End of Guidelines ---\n`;
    }
}
