import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClearanceGuard } from '../auth/guards/clearance.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireClearance } from '../auth/decorators/clearance.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, ClearanceLevel } from '../common/enums/roles.enum';
import { FileService } from './file.service';

// Define file type for multer uploads
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

@Controller('medical/files')
@UseGuards(JwtAuthGuard, RolesGuard, ClearanceGuard)
export class FileController {
    constructor(private readonly fileService: FileService) { }

    @Post('upload/:caseId')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    @RequireClearance(ClearanceLevel.CONFIDENTIAL)
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: MulterFile,
        @Param('caseId') caseId: string,
        @CurrentUser() user: any,
    ) {
        const uploadedFile = await this.fileService.uploadFile(
            file,
            caseId,
            user.id,
            user.clearanceLevel,
        );

        return {
            id: uploadedFile.id,
            originalName: uploadedFile.originalName,
            size: uploadedFile.size,
            uploadedAt: uploadedFile.uploadedAt,
        };
    }

    @Get(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN)
    @RequireClearance(ClearanceLevel.UNCLASSIFIED)
    async getFile(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Res() res: Response,
    ) {
        const fileBuffer = await this.fileService.getFile(id, user.clearanceLevel);
        const fileMetadata = await this.fileService.getFileMetadata(id);

        res.setHeader('Content-Type', fileMetadata.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${fileMetadata.originalName}"`);
        res.send(fileBuffer);
    }

    @Delete(':id')
    @Roles(UserRole.ARMY_MEDICAL_OFFICER, UserRole.ADMIN)
    @RequireClearance(ClearanceLevel.SECRET)
    async deleteFile(@Param('id') id: string, @CurrentUser() user: any) {
        await this.fileService.deleteFile(id, user.clearanceLevel);
        return { message: 'File deleted successfully' };
    }
}
