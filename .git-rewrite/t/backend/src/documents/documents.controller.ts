import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Res,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/roles.enum';

import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentType } from './entities/medical-document.entity';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) {}

    /**
     * POST /documents/upload
     * Multipart upload: file + form fields for metadata.
     * Max file size: 50 MB. Accepted: JPEG, PNG, WEBP, GIF, PDF, DICOM (.dcm).
     */
    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 50 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                const accepted = [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                    'image/gif',
                    'application/pdf',
                    'application/dicom',
                    'application/octet-stream',
                ];
                const isDcm = file.originalname?.toLowerCase().endsWith('.dcm');
                if (accepted.includes(file.mimetype) || isDcm) {
                    cb(null, true);
                } else {
                    cb(
                        new BadRequestException(
                            `Unsupported file type "${file.mimetype}". Accepted: JPEG, PNG, WEBP, PDF, DICOM.`,
                        ),
                        false,
                    );
                }
            },
        }),
    )
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreateDocumentDto,
        @CurrentUser() user: any,
    ) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.documentsService.uploadDocument(
            file,
            dto,
            user.id || user.sub,
            user.clearanceLevel ?? 0,
        );
    }

    /**
     * GET /documents
     * List all documents visible to the authenticated user.
     * Optional query params: type, patientId, isAnalyzed
     */
    @Get()
    async findAll(
        @Query('type') type?: DocumentType,
        @Query('patientId') patientId?: string,
        @Query('isAnalyzed') isAnalyzed?: string,
        @CurrentUser() user?: any,
    ) {
        return this.documentsService.findAll(
            {
                type,
                patientId,
                isAnalyzed: isAnalyzed !== undefined ? isAnalyzed === 'true' : undefined,
            },
            user.clearanceLevel ?? 0,
        );
    }

    /**
     * GET /documents/:id
     * Fetch document metadata + AI analysis (if available).
     */
    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.documentsService.findOne(id, user.clearanceLevel ?? 0);
    }

    /**
     * GET /documents/:id/file
     * Stream the decrypted file. Sets appropriate Content-Type so browsers
     * can render images inline or display the PDF viewer.
     */
    @Get(':id/file')
    async getFile(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Res() res: Response,
    ) {
        const { buffer, mimeType, fileName } = await this.documentsService.getFileBuffer(
            id,
            user.clearanceLevel ?? 0,
        );

        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
            'Content-Length': String(buffer.length),
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'X-Content-Type-Options': 'nosniff',
        });

        return res.send(buffer);
    }

    /**
     * POST /documents/:id/analyze
     * Trigger (or re-trigger) AI analysis. Waits for the analysis to complete
     * and returns the updated document record with aiAnalysis populated.
     */
    @Post(':id/analyze')
    @HttpCode(HttpStatus.OK)
    async analyze(@Param('id') id: string, @CurrentUser() user: any) {
        return this.documentsService.triggerAnalysis(id);
    }

    /**
     * DELETE /documents/:id
     * Soft-delete the document (preserves audit trail and encrypted file).
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        await this.documentsService.remove(id, user.clearanceLevel ?? 0);
    }
}
