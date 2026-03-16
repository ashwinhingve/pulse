import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

import { MedicalDocument, DocumentType } from './entities/medical-document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentAnalysisService } from './document-analysis.service';

interface UploadedFile {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

@Injectable()
export class DocumentsService {
    private readonly logger = new Logger(DocumentsService.name);
    private readonly uploadDir: string;
    private readonly masterKey: Buffer;

    constructor(
        @InjectRepository(MedicalDocument)
        private readonly documentRepo: Repository<MedicalDocument>,
        private readonly configService: ConfigService,
        private readonly analysisService: DocumentAnalysisService,
    ) {
        this.uploadDir = join(process.cwd(), 'uploads', 'documents');
        const keyString = this.configService.get<string>(
            'ENCRYPTION_KEY',
            'change_me_32_char_key_here!!!',
        );
        this.masterKey = Buffer.from(keyString, 'utf-8').slice(0, 32);
    }

    // ── Upload ────────────────────────────────────────────────────────────────

    async uploadDocument(
        file: UploadedFile,
        dto: CreateDocumentDto,
        userId: string,
        userClearance: number,
    ): Promise<MedicalDocument> {
        if (!file?.buffer?.length) {
            throw new BadRequestException('Empty file buffer received');
        }

        await this.ensureUploadDir();

        // Per-file AES-256-CBC key
        const fileKey = randomBytes(32);
        const fileIv = randomBytes(16);
        const cipher = createCipheriv('aes-256-cbc', fileKey, fileIv);
        const encryptedContent = Buffer.concat([cipher.update(file.buffer), cipher.final()]);

        const storedName = `${randomBytes(16).toString('hex')}.enc`;
        await writeFile(join(this.uploadDir, storedName), encryptedContent);

        // Encrypt the file key with the master key
        const keyIv = randomBytes(16);
        const keyCipher = createCipheriv('aes-256-cbc', this.masterKey, keyIv);
        const encryptedKey = Buffer.concat([
            keyCipher.update(fileKey),
            keyCipher.final(),
        ]).toString('base64');
        const combinedIv = Buffer.concat([keyIv, fileIv]).toString('base64');

        const doc = this.documentRepo.create({
            documentType: dto.documentType,
            patientId: dto.patientId,
            caseId: dto.caseId,
            reportDate: dto.reportDate ? new Date(dto.reportDate) : undefined,
            hospitalName: dto.hospitalName,
            doctorName: dto.doctorName,
            notes: dto.notes,
            storedName,
            originalFileName: file.originalname,
            mimeType: this.normaliseMime(file.mimetype, file.originalname),
            fileSize: file.size,
            encryptionKey: encryptedKey,
            iv: combinedIv,
            uploadedBy: userId,
            clearanceRequired: userClearance,
        });

        const saved = await this.documentRepo.save(doc);

        if (dto.analyzeAfterUpload) {
            // Background analysis – does not block the upload response
            this.triggerBackgroundAnalysis(saved.id, file.buffer);
        }

        return saved;
    }

    // ── Read operations ───────────────────────────────────────────────────────

    async findAll(
        filters: {
            type?: DocumentType;
            patientId?: string;
            isAnalyzed?: boolean;
        },
        userClearance: number,
    ): Promise<MedicalDocument[]> {
        const qb = this.documentRepo
            .createQueryBuilder('doc')
            .where('doc.deletedAt IS NULL')
            .andWhere('doc.clearanceRequired <= :clearance', { clearance: userClearance })
            .orderBy('doc.createdAt', 'DESC');

        if (filters.type) {
            qb.andWhere('doc.documentType = :type', { type: filters.type });
        }
        if (filters.patientId) {
            qb.andWhere('doc.patientId = :patientId', { patientId: filters.patientId });
        }
        if (filters.isAnalyzed !== undefined) {
            qb.andWhere('doc.isAnalyzed = :isAnalyzed', { isAnalyzed: filters.isAnalyzed });
        }

        return qb.getMany();
    }

    async findOne(id: string, userClearance: number): Promise<MedicalDocument> {
        const doc = await this.documentRepo.findOne({ where: { id } });
        if (!doc) throw new NotFoundException('Document not found');
        if (doc.clearanceRequired > userClearance) {
            throw new ForbiddenException('Insufficient clearance level to access this document');
        }
        return doc;
    }

    async getFileBuffer(
        id: string,
        userClearance: number,
    ): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
        const doc = await this.findOne(id, userClearance);

        const ivBuffer = Buffer.from(doc.iv, 'base64');
        const keyIv = ivBuffer.slice(0, 16);
        const fileIv = ivBuffer.slice(16);

        const keyDecipher = createDecipheriv('aes-256-cbc', this.masterKey, keyIv);
        const fileKey = Buffer.concat([
            keyDecipher.update(Buffer.from(doc.encryptionKey, 'base64')),
            keyDecipher.final(),
        ]);

        const encryptedContent = await readFile(join(this.uploadDir, doc.storedName));
        const decipher = createDecipheriv('aes-256-cbc', fileKey, fileIv);
        const buffer = Buffer.concat([decipher.update(encryptedContent), decipher.final()]);

        await this.documentRepo.increment({ id }, 'accessCount', 1);

        return { buffer, mimeType: doc.mimeType, fileName: doc.originalFileName };
    }

    // ── Analysis ──────────────────────────────────────────────────────────────

    async triggerAnalysis(id: string): Promise<MedicalDocument> {
        const doc = await this.documentRepo.findOne({ where: { id } });
        if (!doc) throw new NotFoundException('Document not found');

        await this.documentRepo.update(id, { isAnalyzing: true });

        try {
            const { buffer } = await this.getFileBuffer(id, 99); // bypass clearance internally
            const analysis = await this.analysisService.analyzeDocument(doc, buffer);

            await this.documentRepo.update(id, {
                aiAnalysis: analysis,
                isAnalyzed: true,
                isAnalyzing: false,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Analysis failed for ${id}: ${msg}`);
            await this.documentRepo.update(id, { isAnalyzing: false });
            throw err;
        }

        // Re-fetch and return the updated record
        const updated = await this.documentRepo.findOne({ where: { id } });
        if (!updated) throw new NotFoundException('Document not found after analysis');
        return updated;
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    async remove(id: string, userClearance: number): Promise<void> {
        await this.findOne(id, userClearance);
        await this.documentRepo.softDelete(id);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private triggerBackgroundAnalysis(id: string, fileBuffer: Buffer): void {
        setImmediate(async () => {
            try {
                const doc = await this.documentRepo.findOne({ where: { id } });
                if (!doc) return;
                await this.documentRepo.update(id, { isAnalyzing: true });
                const analysis = await this.analysisService.analyzeDocument(doc, fileBuffer);
                await this.documentRepo.update(id, {
                    aiAnalysis: analysis,
                    isAnalyzed: true,
                    isAnalyzing: false,
                });
                this.logger.log(`Background analysis complete for document ${id}`);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                this.logger.error(`Background analysis failed for ${id}: ${msg}`);
                await this.documentRepo.update(id, { isAnalyzing: false }).catch(() => {});
            }
        });
    }

    private async ensureUploadDir(): Promise<void> {
        if (!existsSync(this.uploadDir)) {
            await mkdir(this.uploadDir, { recursive: true });
        }
    }

    private normaliseMime(mimetype: string, filename: string): string {
        if (filename.toLowerCase().endsWith('.dcm')) return 'application/dicom';
        return mimetype || 'application/octet-stream';
    }
}
