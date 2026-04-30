import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { DocumentProcessingService } from '../document-processing/document-processing.service';
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

  async findTaxLawChapterByChapterId(chapterId: string) {
    return await this.taxLawsRepository.findTaxLawChapterByChapterId(chapterId);
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
