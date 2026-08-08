import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    const cloudinaryUpload = await this.cloudinaryService.uploadSingle(
      file,
      'Smart Tax Arena',
    );

    return this.caseRepository.createCase(dto, {
      fileUrl: cloudinaryUpload.url,
      filePublicId: cloudinaryUpload.publicUrl,
    });
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
