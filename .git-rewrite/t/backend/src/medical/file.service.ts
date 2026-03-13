import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { MedicalFile, FileType } from './entities/medical-file.entity';

// Type for multer file upload
interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

@Injectable()
export class FileService {
    private readonly uploadDir: string;
    private readonly masterKey: Buffer;

    constructor(
        @InjectRepository(MedicalFile)
        private fileRepository: Repository<MedicalFile>,
        private configService: ConfigService,
    ) {
        this.uploadDir = join(process.cwd(), 'uploads', 'medical');
        // In production, this should come from secure key management
        const keyString = this.configService.get<string>('ENCRYPTION_KEY');
        this.masterKey = Buffer.from(keyString || 'change_me_32_char_key_here!!!', 'utf-8').slice(0, 32);
    }

    async uploadFile(
        file: UploadedFile,
        caseId: string,
        userId: string,
        clearanceRequired: number,
    ): Promise<MedicalFile> {
        // Ensure upload directory exists
        if (!existsSync(this.uploadDir)) {
            await mkdir(this.uploadDir, { recursive: true });
        }
        // Generate encryption key for this file
        const fileKey = randomBytes(32);
        const iv = randomBytes(16);

        // Encrypt file content
        const cipher = createCipheriv('aes-256-cbc', fileKey, iv);
        const encryptedContent = Buffer.concat([
            cipher.update(file.buffer),
            cipher.final(),
        ]);

        // Generate unique stored filename
        const storedName = `${randomBytes(16).toString('hex')}.enc`;
        const filePath = join(this.uploadDir, storedName);

        // Save encrypted file
        await writeFile(filePath, encryptedContent);

        // Encrypt the file key with master key
        const keyIv = randomBytes(16);
        const keyCipher = createCipheriv('aes-256-cbc', this.masterKey, keyIv);
        const encryptedKey = Buffer.concat([
            keyCipher.update(fileKey),
            keyCipher.final(),
        ]).toString('base64');

        // Determine file type
        const fileType = this.determineFileType(file.mimetype);

        // Save metadata
        const medicalFile = this.fileRepository.create({
            caseId,
            originalName: file.originalname,
            storedName,
            fileType,
            mimeType: file.mimetype,
            size: file.size,
            uploadedBy: userId,
            clearanceRequired,
            encryptionKey: encryptedKey,
            iv: Buffer.concat([keyIv, iv]).toString('base64'),
        });

        return this.fileRepository.save(medicalFile);
    }

    async getFile(fileId: string, userClearance: number): Promise<Buffer> {
        const file = await this.fileRepository.findOne({
            where: { id: fileId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        if (file.clearanceRequired > userClearance) {
            throw new ForbiddenException('Insufficient clearance');
        }

        // Decrypt file key
        const ivBuffer = Buffer.from(file.iv, 'base64');
        const keyIv = ivBuffer.slice(0, 16);
        const fileIv = ivBuffer.slice(16);

        const keyDecipher = createDecipheriv('aes-256-cbc', this.masterKey, keyIv);
        const fileKey = Buffer.concat([
            keyDecipher.update(Buffer.from(file.encryptionKey, 'base64')),
            keyDecipher.final(),
        ]);

        // Read and decrypt file
        const filePath = join(this.uploadDir, file.storedName);
        const encryptedContent = await readFile(filePath);

        const decipher = createDecipheriv('aes-256-cbc', fileKey, fileIv);
        const decryptedContent = Buffer.concat([
            decipher.update(encryptedContent),
            decipher.final(),
        ]);

        // Track access
        await this.fileRepository.update(fileId, {
            accessCount: file.accessCount + 1,
            lastAccessedAt: new Date(),
        });

        return decryptedContent;
    }

    async deleteFile(fileId: string, userClearance: number): Promise<void> {
        const file = await this.fileRepository.findOne({
            where: { id: fileId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        if (file.clearanceRequired > userClearance) {
            throw new ForbiddenException('Insufficient clearance');
        }

        // Delete physical file
        const filePath = join(this.uploadDir, file.storedName);
        await unlink(filePath);

        // Soft delete metadata
        await this.fileRepository.update(fileId, {
            deletedAt: new Date(),
        });
    }

    async getFileMetadata(fileId: string): Promise<MedicalFile> {
        const file = await this.fileRepository.findOne({
            where: { id: fileId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        return file;
    }

    private determineFileType(mimeType: string): FileType {
        if (mimeType.startsWith('image/')) {
            return FileType.IMAGE;
        }
        if (mimeType === 'application/pdf') {
            return FileType.PDF;
        }
        if (mimeType.includes('dicom')) {
            return FileType.DICOM;
        }
        return FileType.IMAGE; // Default
    }
}
