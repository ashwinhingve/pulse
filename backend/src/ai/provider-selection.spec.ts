import { ConfigService } from '@nestjs/config';
import { BioMistralService } from './biomistral.service';

describe('provider routing', () => {
    const originalFetch = global.fetch;
    afterEach(() => { global.fetch = originalFetch; });
    test('never sends a legacy HF key to the configured Groq endpoint', () => {
        const service = new BioMistralService(new ConfigService({ AI_API_KEY: 'your-key-placeholder', AI_BASE_URL: 'https://api.groq.com/openai/v1', BIOMISTRAL_HF_API_KEY: 'hf_test_key', BIOMISTRAL_HF_MODEL_ID: 'test/model' }));
        expect(service.getStatus()).toMatchObject({ provider: 'router.huggingface.co', model: 'test/model' });
    });
    test('uses an explicitly configured Gemini model and reports real provider status', async () => {
        const request = jest.fn().mockImplementation(async () => new Response(JSON.stringify({ choices: [{ message: { content: 'OK' } }] }), { status: 200 }));
        global.fetch = request;
        const service = new BioMistralService(new ConfigService({ GEMINI_API_KEY: 'test-gemini-key', GEMINI_MODEL_ID: 'gemini-test-flash' }));
        await service.onModuleInit();
        expect(request.mock.calls[0][0]).toBe('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
        expect(service.getStatus()).toMatchObject({ status: 'online', model: 'gemini-test-flash' });
        expect((await service.generate('test question')).text).toBe('OK');
    });
    test('reports authentication failure and returns no invented model output', async () => {
        global.fetch = jest.fn().mockResolvedValue(new Response('{}', { status: 401 }));
        const service = new BioMistralService(new ConfigService({ GROQ_API_KEY: 'test-groq-key' }));
        await service.onModuleInit();
        expect(service.getStatus().status).toBe('unavailable');
        expect((await service.generate('test question')).text).toBe('');
    });
});

test('Gemini discovery normalizes model names and skips an unavailable candidate', async () => {
    const originalFetch = global.fetch;
    try {
        global.fetch = jest.fn(async (url: any, init: any) => {
            if (String(url).endsWith('/models')) return new Response(JSON.stringify({ data: [{ id: 'models/gemini-flash-latest' }, { id: 'models/gemini-flash-lite-latest' }] }));
            const model = JSON.parse(init.body).model;
            return model === 'gemini-flash-latest' ? new Response('{}', { status: 503 }) : new Response(JSON.stringify({ choices: [{ message: { content: 'OK' } }] }));
        });
        const service = new BioMistralService(new ConfigService({ GEMINI_API_KEY: 'test-key' }));
        await service.onModuleInit();
        expect(service.getStatus()).toMatchObject({ status: 'online', model: 'gemini-flash-lite-latest' });
    } finally { global.fetch = originalFetch; }
});
