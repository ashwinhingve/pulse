import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnonymizationService } from './anonymization.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(
        private configService: ConfigService,
        private anonymizationService: AnonymizationService,
    ) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');

        if (apiKey && apiKey !== 'demo_key_replace_in_production') {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        } else {
            this.logger.warn('Gemini API key not configured - using mock responses');
        }
    }

    /**
     * Analyze symptoms (anonymized)
     */
    async analyzeSymptoms(data: {
        symptoms: string;
        vitals?: Record<string, any>;
        medicalHistory?: string;
    }): Promise<{
        analysis: string;
        suggestions: string[];
        urgency: 'low' | 'medium' | 'high';
        disclaimer: string;
    }> {
        // Anonymize input
        const anonymized = this.anonymizationService.anonymizeMedicalData({
            symptoms: data.symptoms,
            vitals: data.vitals,
            notes: data.medicalHistory,
        });

        this.logger.log('Analyzing symptoms (anonymized)');

        // If no API key, return mock response
        if (!this.model) {
            return this.getMockSymptomAnalysis();
        }

        try {
            const prompt = `You are a medical decision support system for military field medics. 
Analyze the following anonymized patient data and provide clinical guidance.

Symptoms: ${anonymized.symptoms}
${anonymized.vitals ? `Vitals: ${JSON.stringify(anonymized.vitals)}` : ''}
${anonymized.notes ? `History: ${anonymized.notes}` : ''}

Provide:
1. Clinical analysis
2. Suggested actions
3. Urgency level (low/medium/high)

IMPORTANT: This is decision support only, not diagnosis. Always recommend consulting a physician.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return {
                analysis: text,
                suggestions: this.extractSuggestions(text),
                urgency: this.determineUrgency(text),
                disclaimer: 'AI-generated decision support only. Not a diagnosis. Consult qualified medical personnel.',
            };
        } catch (error) {
            this.logger.error('AI analysis failed', error);
            return this.getMockSymptomAnalysis();
        }
    }

    /**
     * Query clinical protocols
     */
    async queryProtocol(query: string): Promise<{
        protocol: string;
        references: string[];
        disclaimer: string;
    }> {
        // Anonymize query
        const { anonymized } = this.anonymizationService.anonymize(query);

        this.logger.log('Querying protocol (anonymized)');

        if (!this.model) {
            return this.getMockProtocol();
        }

        try {
            const prompt = `You are a military medical protocol assistant.
Provide guidance for: ${anonymized}

Include:
1. Standard protocol steps
2. Key considerations
3. References to military medical guidelines

Keep response concise and actionable.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return {
                protocol: text,
                references: ['TCCC Guidelines', 'Field Manual 4-02'],
                disclaimer: 'AI-generated guidance. Always follow official military medical protocols.',
            };
        } catch (error) {
            this.logger.error('Protocol query failed', error);
            return this.getMockProtocol();
        }
    }

    /**
   * Analyze medical case (anonymized)
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
    disclaimer: string;
  }> {
    // Anonymize all input
    const anonymized = this.anonymizationService.anonymizeMedicalData({
      symptoms: `${caseData.chiefComplaint}. ${caseData.symptoms}`,
      vitals: caseData.vitals,
      notes: caseData.medicalHistory,
    });

    this.logger.log('Analyzing medical case (anonymized)');

    if (!this.model) {
      return this.getMockCaseAnalysis();
    }

    try {
      const prompt = `You are a military medical decision support system.
Analyze this anonymized case and provide clinical guidance.

Severity: ${caseData.severity}
Chief Complaint: ${anonymized.symptoms}
${anonymized.vitals ? `Vitals: ${JSON.stringify(anonymized.vitals)}` : ''}
${anonymized.notes ? `History: ${anonymized.notes}` : ''}

Provide:
1. Clinical analysis
2. Differential diagnosis considerations
3. Recommended immediate actions
4. Similar conditions to consider
5. Urgency assessment

CRITICAL: This is decision support only. Always recommend consulting a physician.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        analysis: text,
        suggestions: this.extractSuggestions(text),
        urgency: this.determineUrgency(text),
        similarConditions: this.extractSimilarConditions(text),
        disclaimer: 'AI-generated decision support only. Not a diagnosis. Consult qualified medical personnel.',
      };
    } catch (error) {
      this.logger.error('Medical case analysis failed', error);
      return this.getMockCaseAnalysis();
    }
  }

  private extractSimilarConditions(text: string): string[] {
    const conditions: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('similar') || line.toLowerCase().includes('differential')) {
        const match = line.match(/[-*]\s*(.+)/);
        if (match) {
          conditions.push(match[1].trim());
        }
      }
    }
    
    return conditions.slice(0, 5);
  }

  private getMockCaseAnalysis() {
    return {
      analysis: 'Mock analysis: Based on the provided symptoms and vitals, this appears to be a common condition. Monitor vital signs and provide supportive care.',
      suggestions: [
        '1. Monitor vital signs every 30 minutes',
        '2. Ensure adequate hydration',
        '3. Document all observations',
        '4. Consult physician if symptoms worsen',
        '5. Consider additional diagnostic tests',
      ],
      urgency: 'medium' as const,
      similarConditions: [
        'Common viral infection',
        'Dehydration',
        'Stress-related symptoms',
      ],
      disclaimer: 'AI-generated decision support only. Not a diagnosis. Consult qualified medical personnel.',
    };
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

    if (lowerText.includes('emergency') || lowerText.includes('urgent') || lowerText.includes('immediate')) {
      return 'high';
    }

    if (lowerText.includes('monitor') || lowerText.includes('observe')) {
      return 'medium';
    }

    return 'low';
  }

  private getMockSymptomAnalysis() {
    return {
      analysis: 'Mock analysis: Based on the provided symptoms, this appears to be a common condition. Monitor vital signs and provide supportive care.',
      suggestions: [
        '1. Monitor vital signs every 30 minutes',
        '2. Ensure adequate hydration',
        '3. Document all observations',
        '4. Consult physician if symptoms worsen',
      ],
      urgency: 'medium' as const,
      disclaimer: 'AI-generated decision support only. Not a diagnosis. Consult qualified medical personnel.',
    };
  }

  private getMockProtocol() {
    return {
      protocol: 'Mock protocol: Follow standard TCCC guidelines for this scenario.',
      references: ['TCCC Guidelines', 'Field Manual 4-02'],
      disclaimer: 'AI-generated guidance. Always follow official military medical protocols.',
    };
  }

  /**
   * General medical assistance for chat
   */
  async getMedicalAssistance(data: {
    query: string;
    context?: string;
    systemPrompt?: string;
  }): Promise<{
    response: string;
    disclaimer: string;
  }> {
    // Anonymize query
    const { anonymized } = this.anonymizationService.anonymize(data.query);

    this.logger.log('Processing medical assistance query (anonymized)');

    if (!this.model) {
      return this.getMockAssistance(data.query);
    }

    try {
      const systemContext = data.systemPrompt || `You are a medical decision support AI assistant for military and public health professionals.
Your role is to provide helpful, accurate medical information while always emphasizing the importance of proper medical supervision.

Guidelines:
- Provide evidence-based medical information
- Always recommend consulting qualified medical professionals
- Never provide definitive diagnoses
- Focus on educational and decision support information
- Maintain patient safety as the highest priority`;

      const prompt = `${systemContext}

${data.context ? `Context: ${data.context}\n` : ''}
User Query: ${anonymized}

Provide a helpful, professional response.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        response: text,
        disclaimer: 'AI-generated guidance for decision support only. Always consult qualified medical professionals.',
      };
    } catch (error) {
      this.logger.error('Medical assistance query failed', error);
      return this.getMockAssistance(data.query);
    }
  }

  private getMockAssistance(query: string) {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('symptom') || lowerQuery.includes('pain')) {
      return {
        response: `Thank you for your query. Based on the symptoms you've described, here are some general considerations:

1. **Initial Assessment**: Conduct a thorough evaluation of vital signs and symptom progression.

2. **Common Causes**: These symptoms can be associated with various conditions. A proper clinical examination is needed.

3. **Recommended Actions**:
   - Monitor vital signs regularly
   - Document symptom changes
   - Ensure patient comfort
   - Consult with a physician for proper diagnosis

4. **When to Seek Immediate Care**: If symptoms worsen or new concerning signs appear.

*This is AI-generated guidance for decision support only. Always follow proper medical protocols and consult qualified professionals.*`,
        disclaimer: 'AI-generated guidance for decision support only. Always consult qualified medical professionals.',
      };
    }

    return {
      response: `Thank you for your query. I'm here to provide medical decision support.

For your question, I recommend:
1. Following established clinical protocols
2. Consulting with relevant specialists
3. Documenting all observations and actions
4. Ensuring proper patient follow-up

Please provide more specific details if you need targeted guidance.

*This is AI-generated guidance for decision support only. Always follow proper medical protocols and consult qualified professionals.*`,
      disclaimer: 'AI-generated guidance for decision support only. Always consult qualified medical professionals.',
    };
  }
}
