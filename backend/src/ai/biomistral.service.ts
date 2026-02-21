import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceClient } from '@huggingface/inference';

interface BioMistralResponse {
    text: string;
    model: string;
    provider: 'huggingface';
}

@Injectable()
export class BioMistralService implements OnModuleInit {
    private readonly logger = new Logger(BioMistralService.name);
    private hfClient: InferenceClient;
    private hfModelId: string;
    private isReady = false;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('BIOMISTRAL_HF_API_KEY', '');
        this.hfModelId = this.configService.get<string>(
            'BIOMISTRAL_HF_MODEL_ID',
            'Qwen/Qwen2.5-72B-Instruct',
        );
        this.hfClient = new InferenceClient(apiKey || undefined);
    }

    async onModuleInit() {
        await this.verifyConnection();
    }

    private async verifyConnection() {
        const apiKey = this.configService.get<string>('BIOMISTRAL_HF_API_KEY', '');
        if (!apiKey) {
            this.logger.warn(
                'BIOMISTRAL_HF_API_KEY not set. Set it in .env to enable AI via HuggingFace Inference API.',
            );
            return;
        }

        try {
            const response = await this.hfClient.chatCompletion({
                model: this.hfModelId,
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5,
            });
            if (response.choices?.[0]) {
                this.isReady = true;
                this.logger.log(
                    `Medical AI connected via HuggingFace Inference API (model: ${this.hfModelId})`,
                );
            }
        } catch (error: any) {
            if (error?.message?.includes('loading')) {
                this.isReady = true;
                this.logger.log(
                    `Medical AI available on HuggingFace (model loading, will be ready shortly)`,
                );
            } else {
                this.logger.warn(
                    `HuggingFace Inference API check failed: ${error?.message || error}`,
                );
                // Try fallback models
                await this.tryFallbackModels();
            }
        }
    }

    private async tryFallbackModels() {
        const fallbacks = [
            'Qwen/Qwen2.5-72B-Instruct',
            'meta-llama/Meta-Llama-3-8B-Instruct',
        ];

        for (const model of fallbacks) {
            if (model === this.hfModelId) continue;
            try {
                const response = await this.hfClient.chatCompletion({
                    model,
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 5,
                });
                if (response.choices?.[0]) {
                    this.hfModelId = model;
                    this.isReady = true;
                    this.logger.log(`Switched to fallback model: ${model}`);
                    return;
                }
            } catch {
                continue;
            }
        }
        this.logger.warn('No working inference model found. Using guideline-based responses only.');
    }

    getProvider(): string {
        return this.isReady ? `huggingface (${this.hfModelId})` : 'guidelines-only';
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
            return {
                text: '',
                model: this.hfModelId,
                provider: 'huggingface',
            };
        }

        const maxTokens = options?.maxTokens || 1024;
        const temperature = options?.temperature || 0.3;

        const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

        if (options?.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }

        messages.push({ role: 'user', content: prompt });

        try {
            const response = await this.hfClient.chatCompletion({
                model: this.hfModelId,
                messages,
                max_tokens: maxTokens,
                temperature,
                top_p: 0.9,
            });

            const text = response.choices?.[0]?.message?.content || '';

            return {
                text: text.trim(),
                model: this.hfModelId,
                provider: 'huggingface',
            };
        } catch (error: any) {
            if (error?.message?.includes('loading')) {
                this.logger.warn('Model is loading on HuggingFace. Retrying in 15s...');
                await new Promise(resolve => setTimeout(resolve, 15000));

                try {
                    const retryResponse = await this.hfClient.chatCompletion({
                        model: this.hfModelId,
                        messages,
                        max_tokens: maxTokens,
                        temperature,
                        top_p: 0.9,
                    });

                    return {
                        text: (retryResponse.choices?.[0]?.message?.content || '').trim(),
                        model: this.hfModelId,
                        provider: 'huggingface',
                    };
                } catch (retryError) {
                    this.logger.error('Retry failed after model loading', retryError);
                }
            } else {
                this.logger.error(`HuggingFace generation failed: ${error?.message || error}`);
            }

            return {
                text: '',
                model: this.hfModelId,
                provider: 'huggingface',
            };
        }
    }
}
