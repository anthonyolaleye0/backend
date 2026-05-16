import { InjectQueue } from '@nestjs/bull';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Queue } from 'bull';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { DocumentProcessingService } from '../document-processing/document-processing.service';
import { CreateChapterDto } from './dtos/create-chapter.dto';
import { CreatePartDto } from './dtos/create-part.dto';
import { CreateScheduleDto } from './dtos/create-schedule.dto';
import { CreateSectionDto } from './dtos/create-section.dto';
import { CreateSubSectionDto } from './dtos/create-subsection.dto';
import { UpdateChapterDto } from './dtos/update-chapter.dto';
import { UpdatePartDto } from './dtos/update-part.dto';
import { UpdateScheduleDto } from './dtos/update-schedule.dto';
import { UpdateSectionDto } from './dtos/update-section.dto';
import { UpdateSubSectionDto } from './dtos/update-subsection.dto';
import { TaxLawsRepository } from './repositories/tax-laws.repository';
import { TaxLawParserService } from './tax-law-parser.service';

@Injectable()
export class TaxLawsService {
  constructor(
    private readonly taxLawsRepository: TaxLawsRepository,
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly taxLawParserService: TaxLawParserService,
    @InjectQueue('tax-law-queue') private readonly taxLawQueue: Queue,
  ) {}

  async getTaxLawScheduleByScheduleId(scheduleId: string) {
    const schedule =
      await this.taxLawsRepository.getTaxLawScheduleByScheduleId(scheduleId);

    if (!schedule) {
      throw new NotFoundException({
        message: 'Schedule not found.',
        success: false,
        status: 404,
      });
    }

    return schedule;
  }

  async createFullTaxLawDocument(file: Express.Multer.File) {
    // 1. Extract text
    const rawText = await this.documentProcessingService.process(file);

    // 2. Parse to JSON
    const structuredData = this.taxLawParserService.parse(rawText);

    // 3. Simple Validation
    if (!structuredData || !structuredData.chapters) {
      throw new Error(
        'Failed to parse document into structured tax law format.',
      );
    }

    // 4. Queue the processing
    return await this.queueTaxLawProcessing(structuredData);
  }

  private async queueTaxLawProcessing(parsedData: any) {
    const targetId = new Types.ObjectId();

    const job = await this.taxLawQueue.add(
      'process-tax-law',
      {
        parsed: parsedData,
        targetId,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs in Redis so you can inspect them if needed
      },
    );

    return {
      jobId: job.id,
      taxLawId: targetId,
      message:
        'Tax law is being processed. This may take a few minutes for large files.',
    };
  }

  async findTaxLaws(queryWithPaginationDto: QueryWithPaginationDto) {
    const taxLaws = await this.taxLawsRepository.findTaxLaws(
      queryWithPaginationDto,
    );
    return taxLaws;
  }

  async searchTaxLaw(queryWithPaginationDto: QueryWithPaginationDto) {
    const taxLaws = await this.taxLawsRepository.searchTaxLaw(
      queryWithPaginationDto,
    );
    return taxLaws;
  }
  async getTaxLawSectionBySectionId(sectionId: string) {
    const taxLaws =
      await this.taxLawsRepository.getTaxLawSectionBySectionId(sectionId);

    if (!taxLaws) {
      throw new NotFoundException({
        message: 'Section not found.',
        success: false,
        status: 404,
      });
    }
    return taxLaws;
  }
  async getTaxLawsTableOfCotent(taxLawId: string) {
    const taxLaws =
      await this.taxLawsRepository.getTaxLawsTableOfCotent(taxLawId);
    return taxLaws;
  }

  async getTaxLawStructureByTaxId(taxId: string) {
    const taxLaw =
      await this.taxLawsRepository.getTaxLawStructureByTaxId(taxId);
    console.log('taxLaw:', taxLaw);

    if (!taxLaw) {
      throw new NotFoundException({
        message: 'Structure not found.',
        success: false,
        status: 404,
      });
    }

    return taxLaw;
  }

  async findLawById(
    taxLawId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    // Ensure your repository filters by { status: 'PUBLISHED' }
    // so users don't see half-finished laws!
    return await this.taxLawsRepository.findLawById(
      taxLawId,
      queryWithPaginationDto,
    );
  }

  async findLawSchedulesByTaxLawId(
    taxLawId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const response = await this.taxLawsRepository.findLawSchedulesByTaxLawId(
      taxLawId,
      queryWithPaginationDto,
    );

    if (!response) {
      throw new NotFoundException({
        message: 'Schedule not found.',
        success: false,
        status: 404,
      });
    }
    return response;
  }

  async findTaxLawChapterByChapterId(chapterId: string) {
    const response =
      await this.taxLawsRepository.findTaxLawChapterByChapterId(chapterId);

    if (!response) {
      throw new NotFoundException({
        message: 'Chapter not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async updateChapter(chapterId: string, updateChapterDto: UpdateChapterDto) {
    const response = await this.taxLawsRepository.updateChapterByChapterId(
      chapterId,
      updateChapterDto,
    );

    if (!response) {
      throw new NotFoundException({
        message: 'Chapter not found.',
        success: false,
        status: 404,
      });
    }

    console.log('service response:', response);

    return response;
  }
  async updateSection(sectionId: string, updateSectoDto: UpdateSectionDto) {
    const response = await this.taxLawsRepository.updateSectionBySectionId(
      sectionId,
      updateSectoDto,
    );

    if (!response) {
      throw new NotFoundException({
        message: 'Section not found.',
        success: false,
        status: 404,
      });
    }

    console.log('service response:', response);

    return response;
  }
  async updateSchedule(
    scheduleId: string,
    updateScheduleDto: UpdateScheduleDto,
  ) {
    const response = await this.taxLawsRepository.updateScheduleByScheduleId(
      scheduleId,
      updateScheduleDto,
    );

    if (!response) {
      throw new NotFoundException({
        message: 'Schedule not found.',
        success: false,
        status: 404,
      });
    }

    console.log('service response:', response);

    return response;
  }
  async updateSubSection(
    subsectionId: string,
    updateSubSectionDto: UpdateSubSectionDto,
  ) {
    const response =
      await this.taxLawsRepository.updateSubSectionBySubSectionId(
        subsectionId,
        updateSubSectionDto,
      );

    if (!response) {
      throw new NotFoundException({
        message: 'Sub section not found.',
        success: false,
        status: 404,
      });
    }

    console.log('service response:', response);

    return response;
  }
  async createSubsectionUsingSectionId(
    sectionId: string,
    createSubSectionDto: CreateSubSectionDto,
  ) {
    const subsectionExist =
      await this.taxLawsRepository.getSubSectionBySectionIdAndNumber(
        sectionId,
        createSubSectionDto.number.trim(),
      );

    if (subsectionExist) {
      throw new ForbiddenException({
        message: `Sub section with number ${createSubSectionDto.number} already exists in this section.`,
        success: false,
        status: 403,
      });
    }

    const response =
      await this.taxLawsRepository.createSubsectionUsingSectionId(
        sectionId,
        createSubSectionDto,
      );

    if (!response) {
      throw new ForbiddenException({
        message: 'unable to create sub section.',
        success: false,
        status: 403,
      });
    }

    console.log('service response:', response);

    return response;
  }
  async createScheduleUsingTaxLawId(
    taxLawId: string,
    createScheduleDto: CreateScheduleDto,
  ) {
    const scheduleExist =
      await this.taxLawsRepository.getScheduleByTaxLawIdAndNumber(
        taxLawId,
        createScheduleDto.number.trim(),
      );

    if (scheduleExist) {
      throw new ForbiddenException({
        message: `Schedule with number ${createScheduleDto.number} already exists in this tax law.`,
        success: false,
        status: 403,
      });
    }

    const response = await this.taxLawsRepository.createScheduleUsingTaxLawId(
      taxLawId,
      createScheduleDto,
    );

    if (!response) {
      throw new ForbiddenException({
        message: 'Unable to create Schedule.',
        success: false,
        status: 403,
      });
    }

    console.log('service response:', response);

    return response;
  }
  async createPartByChapterId(chapterId: string, createPartDto: CreatePartDto) {
    const partExist = await this.taxLawsRepository.getPartByChapterIdAndNumber(
      chapterId,
      createPartDto.number.trim(),
    );

    if (partExist) {
      throw new ForbiddenException({
        message: `Part with number ${createPartDto.number} already exists in this chapter.`,
        success: false,
        status: 403,
      });
    }

    const response = await this.taxLawsRepository.createPartByChapterId(
      chapterId,
      createPartDto,
    );

    if (!response) {
      throw new ForbiddenException({
        message: 'Unable to create part.',
        success: false,
        status: 403,
      });
    }

    console.log('service response:', response);

    return response;
  }
  async createSectionUsingPartId(
    partId: string,
    createSectionDto: CreateSectionDto,
  ) {
    const sectionExist =
      await this.taxLawsRepository.getSectionByPartIdAndNumber(
        partId,
        createSectionDto.number.trim(),
      );

    if (sectionExist) {
      throw new ForbiddenException({
        message: `Section with number ${createSectionDto.number} already exists in this part.`,
        success: false,
        status: 403,
      });
    }

    const response = await this.taxLawsRepository.createSectionUsingPartId(
      partId,
      createSectionDto,
    );

    if (!response) {
      throw new ForbiddenException({
        message: 'Unable to create section.',
        success: false,
        status: 403,
      });
    }

    console.log('service response:', response);

    return response;
  }
  async createChapterUsingTaxLawId(
    taxLawId: string,
    createChapterDto: CreateChapterDto,
  ) {
    const chapterExist =
      await this.taxLawsRepository.getChapterByTaxLawIdAndNumber(
        taxLawId,
        createChapterDto.number.trim(),
      );

    if (chapterExist) {
      throw new ForbiddenException({
        message: `Chapter with number ${createChapterDto.number} already exists in this tax law.`,
        success: false,
        status: 403,
      });
    }

    const response = await this.taxLawsRepository.createChapterUsingTaxLawId(
      taxLawId,
      createChapterDto,
    );

    if (!response) {
      throw new ForbiddenException({
        message: 'Unable to create chapter.',
        success: false,
        status: 403,
      });
    }

    console.log('service response:', response);

    return response;
  }
  async updatePart(partId: string, updatePartDto: UpdatePartDto) {
    const response = await this.taxLawsRepository.updatePartByPartId(
      partId,
      updatePartDto,
    );

    if (!response) {
      throw new NotFoundException({
        message: 'Part not found.',
        success: false,
        status: 404,
      });
    }

    console.log('service response:', response);

    return response;
  }
}

/**
 * 6. Professional Search Tip: The "Metadata" AID
To make the search truly "smart," ensure your Section and Chapter numbers are stored as Strings, not just Numbers (e.g., "Section 12A").

When fetching the "Summary" in Step 1, also return an array of "Available Chapters" (just the numbers). This allows your frontend to build a "Smart Search" dropdown where the user can pick:

Dropdown 1: Select Law (CAMA 2020)

Dropdown 2: Select Chapter (Chapter 1)

Dropdown 3: Select Section (Section 5)

This flow is much better than a "Google-style" text search because legal documents are accessed by reference more often than by keyword.

Does this drill-down flow work for your frontend requirements? If so, I can provide the specific Repository queries to get the Table of Contents in one efficient "Join" (Aggregation).
 */
