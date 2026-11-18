import { DocumentsController } from './documents.controller';
import { DocumentAnalysisService } from './document-analysis.service';

test('denies unauthorized analysis before invoking the provider', async () => {
    const service = { findOne: jest.fn().mockRejectedValue(new Error('Access denied')), triggerAnalysis: jest.fn() };
    await expect(new DocumentsController(service as any).analyze('secret-document', { clearanceLevel: 0 })).rejects.toThrow('Access denied');
    expect(service.triggerAnalysis).not.toHaveBeenCalled();
});
test('does not invent image findings when the vision provider fails', async () => {
    const ai = { getStatus: () => ({ status: 'online' }), generateWithImage: jest.fn().mockRejectedValue(new Error('Provider unavailable')), generate: jest.fn() };
    const service = new DocumentAnalysisService({} as any, ai as any);
    await expect(service.analyzeDocument({ mimeType: 'image/png', originalFileName: 'ecg.png', documentType: 'ecg' } as any, Buffer.from('image'))).rejects.toThrow('No image findings');
    expect(ai.generate).not.toHaveBeenCalled();
});
