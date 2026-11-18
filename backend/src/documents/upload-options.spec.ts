import { plainToInstance } from 'class-transformer';
import { CreateDocumentDto } from './dto/create-document.dto';

test.each([['false', false], [false, false], ['true', true], [true, true]])('respects multipart analysis option %s', (value, expected) => {
    const dto = plainToInstance(CreateDocumentDto, { documentType: 'ecg', analyzeAfterUpload: value }, { enableImplicitConversion: true });
    expect(dto.analyzeAfterUpload).toBe(expected);
});
