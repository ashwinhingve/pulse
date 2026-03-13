import { Injectable, Logger } from '@nestjs/common';
import { AnonymizationService } from './anonymization.service';
import { BioMistralService } from './biomistral.service';
import { MedicalGuidelinesService } from './guidelines/medical-guidelines.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(
        private anonymizationService: AnonymizationService,
        private bioMistralService: BioMistralService,
        private guidelinesService: MedicalGuidelinesService,
    ) {}

    /**
     * Analyze symptoms using BioMistral-7B with AIIMS guidelines context
     */
    async analyzeSymptoms(data: {
        symptoms: string;
        vitals?: Record<string, any>;
        medicalHistory?: string;
    }): Promise<{
        analysis: string;
        suggestions: string[];
        urgency: 'low' | 'medium' | 'high';
        guidelines: { id: string; title: string; category: string }[];
        disclaimer: string;
    }> {
        const anonymized = this.anonymizationService.anonymizeMedicalData({
            symptoms: data.symptoms,
            vitals: data.vitals,
            notes: data.medicalHistory,
        });

        this.logger.log('Analyzing symptoms with BioMistral-7B (anonymized)');

        // Search guidelines for relevant context
        const guidelineContext = this.guidelinesService.buildContextForQuery(data.symptoms);
        const relevantGuidelines = this.guidelinesService.search(data.symptoms).map(g => ({
            id: g.id,
            title: g.title,
            category: g.category,
        }));

        const prompt = `You are BioMistral-7B, an expert medical AI assistant for military and public health professionals.
Use your full medical knowledge to analyze the patient data below. Additionally, reference the AIIMS Antibiotic Policy guidelines when relevant.

${guidelineContext ? `Local AIIMS Guidelines (use as additional reference):\n${guidelineContext}\n` : ''}
Analyze the following anonymized patient data and provide comprehensive clinical guidance.

Symptoms: ${anonymized.symptoms}
${anonymized.vitals ? `Vitals: ${JSON.stringify(anonymized.vitals)}` : ''}
${anonymized.notes ? `History: ${anonymized.notes}` : ''}

Provide:
1. Clinical analysis using your medical knowledge
2. Possible differential diagnoses
3. Suggested actions with specific antibiotic/drug recommendations (reference AIIMS guidelines if applicable)
4. Urgency level (low/medium/high)
5. Any relevant investigations or tests to consider

IMPORTANT: This is decision support only, not diagnosis. Always recommend consulting a physician.`;

        const result = await this.bioMistralService.generate(prompt, {
            maxTokens: 1024,
            temperature: 0.3,
        });

        const analysisText = result.text || this.buildGuidelineBasedAnalysis(data.symptoms);

        return {
            analysis: analysisText,
            suggestions: this.extractSuggestions(analysisText),
            urgency: this.determineUrgency(analysisText),
            guidelines: relevantGuidelines,
            disclaimer:
                'AI-generated decision support only (BioMistral-7B + AIIMS Guidelines). Not a diagnosis. Consult qualified medical personnel.',
        };
    }

    /**
     * Query clinical protocols using AIIMS guidelines
     */
    async queryProtocol(query: string): Promise<{
        protocol: string;
        references: string[];
        guidelines: { id: string; title: string; category: string }[];
        disclaimer: string;
        source: 'biomistral' | 'guidelines-fallback';
    }> {
        const { anonymized } = this.anonymizationService.anonymize(query);
        this.logger.log('Querying protocol with BioMistral-7B (anonymized)');

        const guidelineContext = this.guidelinesService.buildContextForQuery(query);
        const relevantGuidelines = this.guidelinesService.search(query).map(g => ({
            id: g.id,
            title: g.title,
            category: g.category,
        }));

        const prompt = `You are BioMistral-7B, an expert medical AI assistant with comprehensive medical knowledge.
Answer the following medical query using your full training knowledge. When AIIMS Antibiotic Policy guidelines are available below, incorporate them as additional evidence.

${guidelineContext ? `Local AIIMS Guidelines (reference when relevant):\n${guidelineContext}\n` : ''}
Query: ${anonymized}

Provide a comprehensive response including:
1. Direct answer to the query with clinical details
2. Standard protocol steps with specific drug names, dosages, and durations
3. Key considerations, contraindications, and special remarks
4. Alternative treatments if available
5. When to escalate or refer

Keep response concise, evidence-based, and actionable.`;

        const result = await this.bioMistralService.generate(prompt, {
            maxTokens: 1024,
            temperature: 0.3,
        });

        const isBioMistralResponse = !!result.text;
        const protocolText = result.text || this.buildGuidelineBasedProtocol(query);

        return {
            protocol: protocolText,
            references: isBioMistralResponse
                ? ['BioMistral-7B Medical AI', 'AIIMS Antibiotic Policy', 'ICMR Guidelines', 'IDSA Guidelines']
                : ['AIIMS Antibiotic Policy (offline fallback)'],
            guidelines: relevantGuidelines,
            disclaimer: isBioMistralResponse
                ? 'AI-generated guidance (BioMistral-7B + AIIMS Guidelines). Always follow official medical protocols.'
                : 'BioMistral-7B is offline. Showing guideline-based fallback only. Check HuggingFace API key.',
            source: isBioMistralResponse ? 'biomistral' : 'guidelines-fallback',
        };
    }

    /**
     * Analyze medical case using BioMistral-7B with guidelines
     */
    async analyzeMedicalCase(caseData: {
        severity: string;
        chiefComplaint: string;
        symptoms: string;
        vitals?: Record<string, any>;
        medicalHistory?: string;
    }): Promise<{
        analysis: string;
        suggestions: string[];
        urgency: 'low' | 'medium' | 'high';
        similarConditions: string[];
        guidelines: { id: string; title: string; category: string }[];
        disclaimer: string;
    }> {
        const anonymized = this.anonymizationService.anonymizeMedicalData({
            symptoms: `${caseData.chiefComplaint}. ${caseData.symptoms}`,
            vitals: caseData.vitals,
            notes: caseData.medicalHistory,
        });

        this.logger.log('Analyzing medical case with BioMistral-7B (anonymized)');

        const combinedQuery = `${caseData.chiefComplaint} ${caseData.symptoms}`;
        const guidelineContext = this.guidelinesService.buildContextForQuery(combinedQuery);
        const relevantGuidelines = this.guidelinesService.search(combinedQuery).map(g => ({
            id: g.id,
            title: g.title,
            category: g.category,
        }));

        const prompt = `You are BioMistral-7B, an expert medical AI for clinical case analysis.
Use your full medical knowledge to analyze this case. Reference AIIMS guidelines when applicable.

${guidelineContext ? `Local AIIMS Guidelines (reference when relevant):\n${guidelineContext}\n` : ''}
Severity: ${caseData.severity}
Chief Complaint: ${anonymized.symptoms}
${anonymized.vitals ? `Vitals: ${JSON.stringify(anonymized.vitals)}` : ''}
${anonymized.notes ? `History: ${anonymized.notes}` : ''}

Provide:
1. Clinical analysis with pathophysiology
2. Differential diagnosis considerations (ranked by likelihood)
3. Recommended immediate actions with specific drugs/dosages
4. Investigations needed
5. Similar conditions to consider
6. Urgency assessment (low/medium/high)

CRITICAL: This is decision support only. Always recommend consulting a physician.`;

        const result = await this.bioMistralService.generate(prompt, {
            maxTokens: 1500,
            temperature: 0.3,
        });

        const analysisText = result.text || this.buildGuidelineBasedAnalysis(combinedQuery);

        return {
            analysis: analysisText,
            suggestions: this.extractSuggestions(analysisText),
            urgency: this.determineUrgency(analysisText),
            similarConditions: this.extractSimilarConditions(analysisText),
            guidelines: relevantGuidelines,
            disclaimer:
                'AI-generated decision support only (BioMistral-7B + AIIMS Guidelines). Not a diagnosis. Consult qualified medical personnel.',
        };
    }

    /**
     * General medical assistance for chat - powered by BioMistral-7B
     */
    async getMedicalAssistance(data: {
        query: string;
        context?: string;
        systemPrompt?: string;
    }): Promise<{
        response: string;
        guidelines: { id: string; title: string; category: string }[];
        disclaimer: string;
    }> {
        const { anonymized } = this.anonymizationService.anonymize(data.query);
        this.logger.log('Processing medical assistance query with BioMistral-7B (anonymized)');

        const guidelineContext = this.guidelinesService.buildContextForQuery(data.query);
        const relevantGuidelines = this.guidelinesService.search(data.query).map(g => ({
            id: g.id,
            title: g.title,
            category: g.category,
        }));

        const systemContext =
            data.systemPrompt ||
            `You are BioMistral-7B, an expert medical AI assistant for military and public health professionals.
You have comprehensive medical knowledge from your training and also have access to AIIMS Antibiotic Policy guidelines.
Your role is to provide helpful, accurate, and detailed medical information using your full knowledge base.

Guidelines:
- Use your full medical training knowledge to answer queries comprehensively
- Reference AIIMS Antibiotic Policy guidelines when applicable as additional evidence
- Include specific drug names, dosages, and durations
- Always recommend consulting qualified medical professionals
- Never provide definitive diagnoses
- Maintain patient safety as the highest priority`;

        const prompt = `${systemContext}

${guidelineContext ? `Local AIIMS Guidelines (reference when relevant):\n${guidelineContext}\n` : ''}
${data.context ? `Context: ${data.context}\n` : ''}
User Query: ${anonymized}

Provide a comprehensive, evidence-based response using your medical knowledge. Reference AIIMS guidelines where applicable.`;

        const result = await this.bioMistralService.generate(prompt, {
            maxTokens: 1024,
            temperature: 0.4,
            systemPrompt: systemContext,
        });

        const responseText = result.text || this.buildGuidelineBasedResponse(data.query);

        return {
            response: responseText,
            guidelines: relevantGuidelines,
            disclaimer:
                'AI-generated guidance (BioMistral-7B + AIIMS Guidelines) for decision support only. Always consult qualified medical professionals.',
        };
    }

    /**
     * Search guidelines directly
     */
    searchGuidelines(query: string) {
        return this.guidelinesService.search(query).map(g => ({
            id: g.id,
            title: g.title,
            category: g.category,
            content: g.content,
            source: g.source,
        }));
    }

    /**
     * Get all guideline categories
     */
    getGuidelineCategories() {
        return this.guidelinesService.getCategories();
    }

    /**
     * Get guidelines by category
     */
    getGuidelinesByCategory(category: string) {
        return this.guidelinesService.getByCategory(category).map(g => ({
            id: g.id,
            title: g.title,
            category: g.category,
            content: g.content,
            source: g.source,
        }));
    }

    /**
     * Get a specific guideline by ID
     */
    getGuidelineById(id: string) {
        const g = this.guidelinesService.getById(id);
        if (!g) return null;
        return {
            id: g.id,
            title: g.title,
            category: g.category,
            content: g.content,
            keywords: g.keywords,
            source: g.source,
        };
    }

    /**
     * Get AI service status
     */
    getStatus() {
        return {
            bioMistralProvider: this.bioMistralService.getProvider(),
            guidelinesLoaded: this.guidelinesService.getAll().length,
            guidelineCategories: this.guidelinesService.getCategories(),
            source: 'AIIMS Antibiotic Policy',
        };
    }

    // --- Fallback methods when BioMistral returns empty ---

    private buildGuidelineBasedAnalysis(query: string): string {
        const relevant = this.guidelinesService.search(query);
        if (relevant.length === 0) {
            return `**BioMistral-7B is currently unavailable** and no matching AIIMS guidelines were found for your query.

**Your query:** "${query.substring(0, 150)}"

This topic may be outside the scope of the AIIMS Antibiotic Policy guidelines. When BioMistral-7B is online, it can answer any medical question using its full training knowledge.

**Please try:**
- Ensure the HuggingFace API key is configured in backend .env
- Wait 30 seconds and retry (model may be cold-starting)
- Consult qualified medical personnel directly

*Decision support system temporarily limited to AIIMS guidelines only.*`;
        }

        const g = relevant[0];
        return `**Note:** BioMistral-7B is currently unavailable. Showing relevant AIIMS guideline instead.

## ${g.title}

${g.content.substring(0, 2000)}

**Source:** ${g.source}

*For a comprehensive AI-powered answer, ensure BioMistral-7B is connected.*`;
    }

    private buildGuidelineBasedProtocol(query: string): string {
        const relevant = this.guidelinesService.search(query);
        if (relevant.length === 0) {
            return `**BioMistral-7B is currently unavailable** and no matching AIIMS guidelines were found for: "${query.substring(0, 150)}"

This query requires BioMistral-7B's medical knowledge to answer properly. The AIIMS Antibiotic Policy covers: respiratory infections, GI/hepatobiliary, skin/bone, CNS, cardiovascular, urogenital, febrile illness, and bloodstream infections.

**Please try:**
- Ensure the HuggingFace API key is configured
- Wait 30 seconds and retry (model may be cold-starting)

*Decision support system temporarily limited.*`;
        }

        const g = relevant[0];
        return `**Note:** BioMistral-7B is currently unavailable. Showing matching AIIMS guideline.

## ${g.title}

${g.content.substring(0, 2000)}

**Source:** ${g.source}`;
    }

    private buildGuidelineBasedResponse(query: string): string {
        const relevant = this.guidelinesService.search(query);
        if (relevant.length === 0) {
            return `**BioMistral-7B is currently unavailable** and your query doesn't match any AIIMS Antibiotic Policy guideline.

**Your query:** "${query.substring(0, 150)}"

BioMistral-7B can answer any medical question when online. Please check that:
1. The HuggingFace API key is set in the backend .env file
2. The model may need 30 seconds to cold-start

*Decision support system temporarily limited to AIIMS guidelines only.*`;
        }

        const parts = relevant
            .slice(0, 3)
            .map(g => `### ${g.title} (${g.category})\n${g.content.substring(0, 500)}...`);

        return `**Note:** BioMistral-7B is unavailable. Showing matching AIIMS guidelines:

${parts.join('\n\n')}

*For comprehensive answers beyond AIIMS guidelines, ensure BioMistral-7B is connected.*`;
    }

    private extractSimilarConditions(text: string): string[] {
        const conditions: string[] = [];
        const lines = text.split('\n');
        for (const line of lines) {
            if (
                line.toLowerCase().includes('similar') ||
                line.toLowerCase().includes('differential')
            ) {
                const match = line.match(/[-*]\s*(.+)/);
                if (match) {
                    conditions.push(match[1].trim());
                }
            }
        }
        return conditions.slice(0, 5);
    }

    private extractSuggestions(text: string): string[] {
        const lines = text.split('\n');
        const suggestions: string[] = [];
        for (const line of lines) {
            if (line.match(/^\d+\./) || line.match(/^[-*]/)) {
                suggestions.push(line.trim());
            }
        }
        return suggestions.slice(0, 5);
    }

    private determineUrgency(text: string): 'low' | 'medium' | 'high' {
        const lowerText = text.toLowerCase();
        if (
            lowerText.includes('emergency') ||
            lowerText.includes('urgent') ||
            lowerText.includes('immediate') ||
            lowerText.includes('septic shock') ||
            lowerText.includes('necrotising')
        ) {
            return 'high';
        }
        if (lowerText.includes('monitor') || lowerText.includes('observe')) {
            return 'medium';
        }
        return 'low';
    }
}
