import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuth } from 'google-auth-library';
import * as https from 'https';

const MODEL_NAME = 'MedGemma-1.5-4B';
const DEFAULT_ENDPOINT =
    'https://mg-endpoint-7907ffa6-702f-493a-bdec-4d089d60e12f.europe-west4-940272651572.prediction.vertexai.goog/v1/projects/940272651572/locations/europe-west4/endpoints/mg-endpoint-7907ffa6-702f-493a-bdec-4d089d60e12f:predict';
const IMAGE_BASE64_LIMIT_BYTES = 15 * 1024 * 1024;

export interface MedGemmaResponse {
    text: string;
    model: string;
}

@Injectable()
export class MedGemmaService implements OnModuleInit {
    private readonly logger = new Logger(MedGemmaService.name);
    private auth: GoogleAuth;
    private endpointUrl: string;
    private isReady = false;

    constructor(private readonly configService: ConfigService) {
        this.endpointUrl =
            this.configService.get<string>('MEDGEMMA_ENDPOINT_URL') || DEFAULT_ENDPOINT;

        const credentialsJson = this.configService.get<string>(
            'GOOGLE_APPLICATION_CREDENTIALS_JSON',
        );
        if (!credentialsJson) {
            this.logger.warn(
                'GOOGLE_APPLICATION_CREDENTIALS_JSON not set — MedGemma document analysis unavailable.',
            );
            return;
        }

        let credentials: object;
        try {
            credentials = JSON.parse(credentialsJson);
        } catch {
            this.logger.warn(
                'GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON — MedGemma unavailable.',
            );
            return;
        }

        this.auth = new GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
    }

    async onModuleInit() {
        await this.verifyConnection();
    }

    private async verifyConnection() {
        if (!this.auth) return;
        try {
            const token = await this.getAccessToken();
            if (token) {
                this.isReady = true;
                this.logger.log('MedGemma 1.5 connected — Vertex AI endpoint ready');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.warn(`MedGemma Vertex AI connection check failed: ${msg}`);
        }
    }

    private async getAccessToken(): Promise<string> {
        if (!this.auth) throw new Error('GoogleAuth not initialised — missing credentials');
        const client = await this.auth.getClient();
        const tokenResponse = await client.getAccessToken();
        const token = tokenResponse?.token;
        if (!token) throw new Error('Failed to obtain Google OAuth2 access token');
        return token;
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    async generate(
        prompt: string,
        options?: { systemPrompt?: string; maxTokens?: number },
    ): Promise<MedGemmaResponse> {
        if (!this.auth) {
            throw new Error('MedGemma not configured (GOOGLE_APPLICATION_CREDENTIALS_JSON missing)');
        }

        // vLLM expects system content as plain string, user content as plain string
        const messages: Array<{ role: string; content: string }> = [];
        if (options?.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        return this.callVertexAI(messages, options?.maxTokens ?? 2048);
    }

    async generateWithImage(
        imageDataUrl: string,
        prompt: string,
        systemPrompt?: string,
    ): Promise<MedGemmaResponse> {
        if (!this.auth) {
            throw new Error('MedGemma not configured (GOOGLE_APPLICATION_CREDENTIALS_JSON missing)');
        }

        const base64Part = imageDataUrl.split(',')[1] || '';
        const approxBytes = Math.round((base64Part.length * 3) / 4);
        if (approxBytes > IMAGE_BASE64_LIMIT_BYTES) {
            this.logger.warn(
                `Image is ~${Math.round(approxBytes / 1024 / 1024)} MB — may exceed MedGemma 4B context`,
            );
        }

        // For multimodal messages: system as string, user as content array
        const messages: Array<{ role: string; content: string | Array<{ type: string; [k: string]: unknown }> }> = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({
            role: 'user',
            content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
        });

        return this.callVertexAI(messages, 2048);
    }

    // ── Vertex AI request ──────────────────────────────────────────────────────

    private callVertexAI(
        messages: Array<{ role: string; content: unknown }>,
        maxTokens: number,
    ): Promise<MedGemmaResponse> {
        return this.getAccessToken().then(token => {
            const payload = JSON.stringify({
                instances: [
                    {
                        '@requestFormat': 'chatCompletions',
                        messages,
                        max_tokens: maxTokens,
                        temperature: 0.15,
                        top_p: 0.9,
                    },
                ],
            });

            return new Promise<MedGemmaResponse>((resolve, reject) => {
                const url = new URL(this.endpointUrl);
                const opts: https.RequestOptions = {
                    hostname: url.hostname,
                    path: url.pathname + url.search,
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payload),
                    },
                    timeout: 120_000,
                };

                const req = https.request(opts, res => {
                    const chunks: Buffer[] = [];
                    res.on('data', (chunk: Buffer) => chunks.push(chunk));
                    res.on('end', () => {
                        const raw = Buffer.concat(chunks).toString('utf8');

                        // Always log what Vertex AI returned for diagnosis
                        this.logger.log(
                            `Vertex AI HTTP ${res.statusCode} — raw body (first 600 chars): ${raw.slice(0, 600)}`,
                        );

                        let body: any;
                        try {
                            body = JSON.parse(raw);
                        } catch {
                            return reject(new Error(`Vertex AI non-JSON response: ${raw.slice(0, 200)}`));
                        }

                        if (res.statusCode && res.statusCode >= 400) {
                            return reject(
                                new Error(
                                    `Vertex AI HTTP ${res.statusCode}: ${JSON.stringify(body).slice(0, 400)}`,
                                ),
                            );
                        }

                        const text = this.extractText(body);

                        if (!text) {
                            this.logger.warn(
                                `MedGemma returned empty text. Full body: ${JSON.stringify(body).slice(0, 800)}`,
                            );
                        } else {
                            this.logger.log(
                                `MedGemma response (first 300 chars): ${text.slice(0, 300)}`,
                            );
                        }

                        resolve({ text: text.trim(), model: MODEL_NAME });
                    });
                });

                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Vertex AI request timed out after 120 s'));
                });
                req.on('error', reject);
                req.write(payload);
                req.end();
            });
        });
    }

    // ── Response text extractor — handles all known Vertex AI / vLLM formats ───

    private extractText(body: any): string {
        if (!body) return '';

        // ── Format 0: Vertex AI returns predictions as a PLAIN OBJECT (not array)
        // Observed: { "predictions": { "choices": [{ "message": { "content": "..." } }] } }
        const predObj = body?.predictions;
        if (predObj && !Array.isArray(predObj) && typeof predObj === 'object') {
            const v0 = predObj?.choices?.[0]?.message?.content;
            if (typeof v0 === 'string' && v0) return v0;
            // Flat fields on the object
            const v0b = predObj?.content ?? predObj?.text ?? predObj?.output ?? predObj?.generated_text;
            if (typeof v0b === 'string' && v0b) return v0b;
        }

        // ── Format 1: Standard vLLM chatCompletions inside predictions array ────
        // body.predictions[0].choices[0].message.content
        const pred0 = body?.predictions?.[0];
        if (pred0) {
            const v1 = pred0?.choices?.[0]?.message?.content;
            if (typeof v1 === 'string' && v1) return v1;

            // ── Format 2: predictions[0] is itself a JSON string ────────────────
            if (typeof pred0 === 'string') {
                try {
                    const inner = JSON.parse(pred0);
                    const v2 = inner?.choices?.[0]?.message?.content;
                    if (typeof v2 === 'string' && v2) return v2;
                    const v2b = inner?.content ?? inner?.text ?? inner?.output;
                    if (typeof v2b === 'string' && v2b) return v2b;
                } catch { /* not JSON */ }
                // Raw string content
                if (pred0.length > 5) return pred0;
            }

            // ── Format 3: Gemini-style candidates ───────────────────────────────
            const v3 = pred0?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (typeof v3 === 'string' && v3) return v3;

            // ── Format 4: flat content / text / output ───────────────────────────
            const v4 = pred0?.content ?? pred0?.text ?? pred0?.output ?? pred0?.generated_text;
            if (typeof v4 === 'string' && v4) return v4;
        }

        // ── Format 5: Top-level OpenAI format (no predictions wrapper) ──────────
        const v5 = body?.choices?.[0]?.message?.content;
        if (typeof v5 === 'string' && v5) return v5;

        // ── Format 6: Predictions is an array of strings ─────────────────────────
        if (Array.isArray(body?.predictions)) {
            for (const p of body.predictions) {
                if (typeof p === 'string' && p.length > 5) return p;
            }
        }

        return '';
    }
}
