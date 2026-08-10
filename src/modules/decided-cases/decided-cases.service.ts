import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { CloudinaryService } from '../../common/infrastructure/cloudinary/cloudinary.service';
import { CreateDecidedCaseDto } from './dtos/create-decided-case.dto';
import { QueryDecidedCasesDto } from './dtos/query-decided-case.dto';
import { DecidedCaseRepository } from './repositories/decided-case.repository';

@Injectable()
export class DecidedCasesService {
  constructor(
    private readonly caseRepository: DecidedCaseRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createCase(file: Express.Multer.File, dto: CreateDecidedCaseDto) {
    if (!file) {
      throw new BadRequestException({
        message: 'Case document file (PDF/Doc) is required',
        success: false,
        status: 400,
      });
    }

    console.log('file:', file);
    console.log('dto:', dto);

    try {
      const cloudinaryUpload = await this.cloudinaryService.uploadSingle(
        file,
        'Smart Tax Arena',
      );

      return this.caseRepository.createCase(dto, {
        fileUrl: cloudinaryUpload.url,
        filePublicId: cloudinaryUpload.publicUrl,
      });
    } finally {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  async getAllCases(queryDto: QueryDecidedCasesDto) {
    const response = await this.caseRepository.findAllCases(queryDto);

    return response;
  }

  async getCaseById(id: string) {
    const caseDoc = await this.caseRepository.findCaseById(id);

    if (!caseDoc) {
      throw new NotFoundException({
        message: 'Decided case record not found',
        success: false,
        status: 404,
      });
    }
    return caseDoc;
  }

  async getCasePdfStream(id: string) {
    const caseDoc = await this.getCaseById(id);

    if (!caseDoc || !caseDoc.fileUrl) {
      throw new NotFoundException({
        message: 'Decided case document not found',
        success: false,
        status: 404,
      });
    }

    try {
      let downloadUrl = caseDoc.fileUrl;

      // 1. Generate an authenticated, time-signed Cloudinary private download URL
      if (caseDoc.filePublicId) {
        // Determine whether resource was saved as 'image' or 'raw'
        const isRawType = caseDoc.fileUrl.includes('/raw/upload/');
        const resourceType = isRawType ? 'raw' : 'image';

        // generate_private_download_url attaches timestamp & auth signature (bypasses 401)
        downloadUrl = cloudinary.utils.private_download_url(
          caseDoc.filePublicId,
          'pdf',
          {
            resource_type: resourceType,
            type: 'upload',
            expires_at: Math.floor(Date.now() / 1000) + 3600, // Valid for 1 hour
          },
        );
      }

      console.log('Fetching PDF via private download URL:', downloadUrl);

      // 2. Fetch binary stream using authenticated signed URL
      let response = await fetch(downloadUrl);

      // Fallback: If private_download_url fails, try direct signed URL
      if (!response.ok && caseDoc.filePublicId) {
        const fallbackUrl = cloudinary.url(caseDoc.filePublicId, {
          resource_type: caseDoc.fileUrl.includes('/raw/') ? 'raw' : 'image',
          format: 'pdf',
          sign_url: true,
          secure: true,
        });

        response = await fetch(fallbackUrl);
      }

      if (!response.ok) {
        throw new Error(`Cloudinary returned HTTP status ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        buffer,
        contentType: response.headers.get('content-type') || 'application/pdf',
        fileName: `${caseDoc.suitNumber || 'decided-case'}.pdf`,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to fetch PDF from Cloudinary: ${error.message}`,
      );
    }
  }

  async deleteCase(id: string) {
    const caseDoc = await this.caseRepository.softDeleteCase(id);

    if (!caseDoc) {
      throw new NotFoundException({
        message: 'Decided case record not found',
        success: false,
        status: 404,
      });
    }

    if (caseDoc.filePublicId) {
      await this.cloudinaryService.delete(caseDoc.filePublicId);
    }

    return { success: true, message: 'Decided case record removed' };
  }
}
