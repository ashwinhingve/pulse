import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuth } from 'google-auth-library';

interface BioMistralResponse {
    text: string;
    model: string;
    provider: string;
}

type ChatRole = 'system' | 'user' | 'assistant';
type ChatContent = string | Array<{ type: string; [key: string]: unknown }>;
interface ChatMessage {
    role: ChatRole;
    content: ChatContent;
}

/**
 * Provider-neutral medical text/vision adapter. The legacy class name preserves imports.
 * Explicit AI_API_KEY/AI_BASE_URL/AI_MODEL_ID takes precedence, followed by Gemini,
 * Groq, Google service-account Vertex, then legacy Hugging Face configuration.
 * Credentials are routed only to their provider. No model or free quota is assumed
 * to be available: a small startup probe determines the reported operational state.
 */
@Injectable()
export class BioMistralService implements OnModuleInit {
    private readonly logger = new Logger(BioMistralService.name);

    private readonly apiKey: string;
    private readonly baseUrl: string;
    private modelId: string;
    private visionModelId: string;
    private isReady = false;
    private googleAuth?: GoogleAuth;
    private googleProject?: string;
    private statusError?: string;

    constructor(private configService: ConfigService) {
        const configured = (name: string) => {
            const value = this.configService.get<string>(name, '').trim();
            return value && !/your[-_ ]|change[-_ ]?me|placeholder|xxxxx/i.test(value) ? value : '';
        };
        const generic = configured('AI_API_KEY'), gemini = configured('GEMINI_API_KEY') || configured('GOOGLE_API_KEY');
        const groq = configured('GROQ_API_KEY'), hf = configured('BIOMISTRAL_HF_API_KEY');
        const credentials = configured('GOOGLE_APPLICATION_CREDENTIALS_JSON');
        this.apiKey = generic || gemini || groq || '';
        if (generic) {
            this.baseUrl = this.normalizeBaseUrl(configured('AI_BASE_URL') || 'https://api.groq.com/openai/v1');
            this.modelId = configured('AI_MODEL_ID') || 'llama-3.3-70b-versatile';
        } else if (gemini) {
            this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
            this.modelId = configured('GEMINI_MODEL_ID') || '';
        } else if (groq) {
            this.baseUrl = 'https://api.groq.com/openai/v1';
            this.modelId = configured('GROQ_MODEL_ID') || 'llama-3.3-70b-versatile';
        } else if (credentials) {
            this.baseUrl = 'https://aiplatform.googleapis.com';
            this.modelId = configured('VERTEX_MODEL_ID') || 'gemini-2.5-flash';
            try {
                const parsed = JSON.parse(credentials);
                this.googleProject = parsed.project_id;
                this.googleAuth = new GoogleAuth({ credentials: parsed, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
            } catch { this.statusError = 'Invalid Google service-account configuration'; }
        } else {
            this.apiKey = hf;
            this.baseUrl = 'https://router.huggingface.co/v1';
            this.modelId = configured('BIOMISTRAL_HF_MODEL_ID') || '';
        }
        this.visionModelId = configured('AI_VISION_MODEL_ID') ||
            (this.baseUrl.includes('googleapis.com') ? this.modelId : '');
    }

    async onModuleInit() {
        await this.verifyConnection();
    }

    private normalizeBaseUrl(url: string): string {
        return url.replace(/\/+$/, '');
    }

    private get host(): string {
        try {
            return new URL(this.baseUrl).host;
        } catch {
            return this.baseUrl;
        }
    }

    private async verifyConnection() {
        if (!this.apiKey && !this.googleAuth) {
            this.statusError = 'No working provider credential configured';
            return;
        }
        try {
            let candidates = [this.modelId];
            if (!this.modelId && this.apiKey) {
                const response = await fetch(`${this.baseUrl}/models`, { headers: { Authorization: `Bearer ${this.apiKey}` }, signal: AbortSignal.timeout(15000) });
                if (!response.ok) throw new Error(`Model discovery HTTP ${response.status}`);
                const data = await response.json() as any;
                const models: string[] = (data.data || []).map((model: any) => this.baseUrl.includes('googleapis.com') ? String(model.id).replace(/^models\//, '') : String(model.id));
                candidates = models.filter(model => this.baseUrl.includes('googleapis.com') ? /gemini.*flash/i.test(model) && !/image|tts|live|audio|omni/i.test(model) : /llama-3.1-8b-instruct/i.test(model));
                candidates.sort((a, b) => Number(/latest/.test(b)) - Number(/latest/.test(a)));
            }
            let lastError = new Error('No supported model discovered');
            for (const model of candidates.slice(0, 6)) {
                if (!model) continue;
                try {
                    const text = await this.chatCompletion({ model, messages: [{ role: 'user', content: 'Reply only OK.' }], max_tokens: 128 });
                    if (!text?.trim()) throw new Error('Provider returned no text');
                    this.modelId = model;
                    if (this.baseUrl.includes('googleapis.com')) this.visionModelId = model;
                    this.isReady = true;
                    this.statusError = undefined;
                    return;
                } catch (error: any) { lastError = error; }
            }
            throw lastError;
        } catch (error: any) {
            this.isReady = false;
            // Never log upstream bodies, credentials, or clinical prompts.
            this.statusError = /^.*HTTP \d{3}$/.test(error.message) ? error.message : 'Provider authentication or connectivity failed';
            this.logger.warn(this.statusError);
        }
    }

    getStatus() {
        return { provider: this.host, model: this.modelId || null, visionModel: this.visionModelId || null,
            configured: !!(this.apiKey || this.googleAuth), status: this.isReady ? 'online' : 'unavailable', error: this.statusError };
    }

    getProvider(): string {
        return this.isReady ? `${this.host} (${this.modelId})` : 'guidelines-only';
    }

    /**
     * Low-level OpenAI-compatible chat completion.
     * Returns the assistant message content, or `null` if the response had no content.
     * Throws on transport / HTTP errors so callers can decide whether to retry.
     */
    private async chatCompletion(params: {
        model: string;
        messages: ChatMessage[];
        max_tokens: number;
        temperature?: number;
        top_p?: number;
    }): Promise<string | null> {
        if (this.googleAuth && this.googleProject) {
            const token = await this.googleAuth.getAccessToken();
            const parts = (content: ChatContent): any[] => typeof content === 'string' ? [{ text: content }] : content.map(part => {
                if (part.type === 'text') return { text: part.text };
                const url = (part.image_url as any)?.url || '';
                const match = url.match(/^data:([^;]+);base64,(.*)$/s);
                if (!match) throw new Error('Unsupported image format');
                return { inlineData: { mimeType: match[1], data: match[2] } };
            });
            const system = params.messages.filter(message => message.role === 'system').flatMap(message => parts(message.content));
            const response = await fetch(`${this.baseUrl}/v1/projects/${this.googleProject}/locations/global/publishers/google/models/${params.model}:generateContent`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: params.messages.filter(message => message.role !== 'system').map(message => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: parts(message.content) })),
                    ...(system.length ? { systemInstruction: { parts: system } } : {}),
                    generationConfig: { maxOutputTokens: params.max_tokens, temperature: params.temperature ?? 0.3,
                        ...(params.model.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}) } }),
                signal: AbortSignal.timeout(30000),
            });
            if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
            const data = await response.json() as any;
            return data.candidates?.[0]?.content?.parts?.filter((part: any) => !part.thought).map((part: any) => part.text || '').join('') || null;
        }
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
            signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) {
            throw new Error(`Provider HTTP ${res.status}`);
        }

        const data: any = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === 'string') return content;
        // Some providers stream content as an array of parts.
        if (Array.isArray(content)) {
            const joined = content
                .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
                .join('');
            return joined || null;
        }
        return null;
    }

    /**
     * Generate a response with an embedded image (multimodal / vision).
     * Uses a separate vision-capable model from the standard text model.
     * @param imageDataUrl  base64 data URL: "data:<mime>;base64,<data>"
     * @param prompt        User instruction / question about the image
     * @param systemPrompt  Optional system context
     */
    async generateWithImage(
        imageDataUrl: string,
        prompt: string,
        systemPrompt?: string,
    ): Promise<BioMistralResponse> {
        if (!this.visionModelId || (!this.apiKey && !this.googleAuth)) {
            this.logger.warn('Vision provider is not configured');
            return { text: '', model: this.visionModelId, provider: this.host };
        }

        const messages: ChatMessage[] = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({
            role: 'user',
            content: [
                { type: 'image_url', image_url: { url: imageDataUrl } },
                { type: 'text', text: prompt },
            ],
        });

        try {
            const text =
                (await this.chatCompletion({
                    model: this.visionModelId,
                    messages,
                    max_tokens: 1500,
                    temperature: 0.25,
                    top_p: 0.9,
                })) || '';
            return { text: text.trim(), model: this.visionModelId, provider: this.host };
        } catch (error: any) {
            this.logger.error(
                `Vision model (${this.visionModelId}) failed`,
            );
            throw error;
        }
    }

    async generate(
        prompt: string,
        options?: {
            maxTokens?: number;
            temperature?: number;
            systemPrompt?: string;
        },
    ): Promise<BioMistralResponse> {
        if (!this.isReady) {
            return { text: '', model: this.modelId, provider: this.host };
        }

        const maxTokens = options?.maxTokens || 1024;
        const temperature = options?.temperature ?? 0.3;

        const messages: ChatMessage[] = [];
        if (options?.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        try {
            const text =
                (await this.chatCompletion({
                    model: this.modelId,
                    messages,
                    max_tokens: maxTokens,
                    temperature,
                    top_p: 0.9,
                })) || '';

            return { text: text.trim(), model: this.modelId, provider: this.host };
        } catch (error: any) {
            this.logger.error(
                `AI generation failed on ${this.host}`,
            );
            return { text: '', model: this.modelId, provider: this.host };
        }
    }
}
