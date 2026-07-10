import { InjectQueue } from '@nestjs/bull';
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Queue } from 'bull';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { AmendmentsService } from '../amendments/amendments.service';
import { TargetLevel } from '../amendments/dtos/create-amendment.dto';
import { TaxLawLevels } from '../amendments/schemas/amendment.schema';
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

    @Inject(forwardRef(() => AmendmentsService))
    private readonly amendmentsService: AmendmentsService,
    @InjectQueue('tax-law-queue') private readonly taxLawQueue: Queue,
  ) {}

  async getEntityBase(entityId: string): Promise<{
    entityId: string;
    level: TargetLevel;
    title: string;
    content?: string;
  }> {
    // pseudo logic — depends on your schema

    const chapter =
      await this.taxLawsRepository.getChapterByChapterId(entityId);
    if (chapter) {
      return {
        entityId: chapter._id.toString(),
        level: TargetLevel.CHAPTER,
        title: chapter.title,
      };
    }

    const section =
      await this.taxLawsRepository.getSectionBySectionId(entityId);
    if (section) {
      return {
        entityId: section._id.toString(),
        level: TargetLevel.SECTION,
        title: section.title || '',
        content: section.content,
      };
    }

    const subsection =
      await this.taxLawsRepository.getSubSectionBySubSectionId(entityId);
    if (subsection) {
      return {
        entityId: subsection._id.toString(),
        level: TargetLevel.SUBSECTION,
        title: '',
        content: subsection.content,
      };
    }

    throw new NotFoundException({
      message: 'Entity not found',
      success: false,
      status: 404,
    });
  }

  async resolveTaxLawIdFromEntity(level: TaxLawLevels, entityId: string) {
    const response = await this.taxLawsRepository.resolveTaxLawIdFromEntity(
      level,
      entityId,
    );

    return response;
  }

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
  // async getTaxLawSectionBySectionId(sectionId: string) {
  //   const taxLaws =
  //     await this.taxLawsRepository.getTaxLawSectionBySectionId(sectionId);

  //   if (!taxLaws) {
  //     throw new NotFoundException({
  //       message: 'Section not found.',
  //       success: false,
  //       status: 404,
  //     });
  //   }
  //   return taxLaws;
  // }

  async getTaxLawSectionBySectionId(sectionId: string, asOf?: Date) {
    const response =
      await this.taxLawsRepository.getTaxLawSectionBySectionId(sectionId);

    if (!response) {
      throw new NotFoundException({
        message: 'Section not found.',
        success: false,
        status: 404,
      });
    }

    // ================================
    // 1. COLLECT ENTITY IDS
    // ================================
    const entityIds: string[] = [];

    entityIds.push(response._id.toString());

    for (const sub of response.subsections || []) {
      entityIds.push(sub._id.toString());
    }

    // ================================
    // 2. FETCH AMENDMENTS
    // ================================
    const amendments = await this.amendmentsService.findAmendmentsByEntityIds(
      entityIds,
      asOf,
    );

    // ================================
    // 3. GROUP BY ENTITY ID
    // ================================
    const amendmentMap = new Map<string, any[]>();

    console.log('MAP KEYS:', [...amendmentMap.keys()]);
    console.log(
      'SUB IDs:',
      (response.subsections || []).map((s) => s._id.toString()),
    );

    console.log('asOf:', asOf);

    for (const amendment of amendments) {
      const key = amendment.target.entityId.toString();

      if (!amendmentMap.has(key)) {
        amendmentMap.set(key, []);
      }

      amendmentMap.get(key)!.push(amendment);
    }

    console.log('MAP KEYS:', [...amendmentMap.keys()]);

    // ================================
    // 4. APPLY AMENDMENTS FUNCTION
    // ================================
    const applyAmendments = (entity: any) => {
      const entityAmendments = amendmentMap.get(entity._id.toString()) || [];

      let title = entity.title ?? entity.subsection?.title;
      let content = entity.content ?? entity.subsection?.content;

      // Sort by date
      entityAmendments.sort(
        (a, b) =>
          new Date(a.effectiveDate).getTime() -
          new Date(b.effectiveDate).getTime(),
      );

      for (const amendment of entityAmendments) {
        if (amendment.type === 'MODIFY') {
          if (amendment.changes?.title !== undefined) {
            title = amendment.changes.title;
          }

          if (amendment.changes?.content !== undefined) {
            content = amendment.changes.content;
          }
        }

        if (amendment.type === 'REPEAL') {
          content = '[REPEALED]';
        }
      }

      return {
        ...entity,
        title,
        content,

        ...(entity.subsection && {
          subsection: {
            ...entity.subsection,
            title,
            content,
          },
        }),
        original: {
          title: entity.title ?? entity.subsection?.title,
          content: entity.content ?? entity.subsection?.content,
        },
        meta: {
          isAmended: entityAmendments.length > 0,
          amendmentCount: entityAmendments.length,
        },
      };
    };

    // ================================
    // 5. APPLY TO SECTION + SUBSECTIONS
    // ================================

    const resolvedSection = applyAmendments(response);

    resolvedSection.subsections = (response.subsections || []).map((sub) =>
      applyAmendments(sub),
    );

    return resolvedSection;
  }
  async getTaxLawSubSectionBySubSectionId(subSectionId: string, asOf?: Date) {
    // ================================
    // 1. FETCH SUBSECTION
    // ================================
    const subSection =
      await this.taxLawsRepository.getTaxLawSubSectionBySubSectionId(
        subSectionId,
      );

    if (!subSection) {
      throw new NotFoundException({
        message: 'Sub section not found.',
        success: false,
        status: 404,
      });
    }

    // ================================
    // 2. FETCH AMENDMENTS FOR THIS SUBSECTION ONLY
    // ================================
    const amendments = await this.amendmentsService.findAmendmentsByEntityIds(
      [subSection._id.toString()],
      asOf,
    );

    // ================================
    // 3. SORT AMENDMENTS (IMPORTANT)
    // ================================
    amendments.sort(
      (a, b) =>
        new Date(a.effectiveDate).getTime() -
        new Date(b.effectiveDate).getTime(),
    );

    // ================================
    // 4. APPLY AMENDMENTS
    // ================================
    let content = subSection.content;

    for (const amendment of amendments) {
      if (amendment.type === 'MODIFY') {
        if (amendment.changes?.content !== undefined) {
          content = amendment.changes.content;
        }
      }

      if (amendment.type === 'DELETE') {
        content = '[REPEALED]';
      }
    }

    // ================================
    // 5. RETURN RESOLVED SUBSECTION
    // ================================
    return {
      ...(subSection.toObject?.() ?? subSection),

      content,

      original: {
        content: subSection.content,
      },

      meta: {
        isAmended: amendments.length > 0,
        amendmentCount: amendments.length,
      },
    };
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

  // async findTaxLawChapterByChapterId(chapterId: string) {
  //   const response =
  //     await this.taxLawsRepository.findTaxLawChapterByChapterId(chapterId);

  //   if (!response) {
  //     throw new NotFoundException({
  //       message: 'Chapter not found.',
  //       success: false,
  //       status: 404,
  //     });
  //   }

  //   // APPLY AMENDMENTS RECURSIVELY

  //   // Chapter
  //   const resolvedChapter = await this.amendmentsService.resolveFromBase({
  //     _id: response._id,
  //     title: response.title,
  //     level: 'CHAPTER',
  //   });

  //   // Parts
  //   resolvedChapter.parts = await Promise.all(
  //     chapter.parts.map(async (part) => {
  //       const resolvedPart = await this.amendmentsService.resolveFromBase({
  //         _id: part._id,
  //         title: part.title,
  //         level: 'PART',
  //       });

  //       resolvedPart.sections = await Promise.all(
  //         part.sections.map(async (section) => {
  //           const resolvedSection =
  //             await this.amendmentsService.resolveFromBase({
  //               _id: section._id,
  //               title: section.title,
  //               content: section.content,
  //               level: 'SECTION',
  //             });

  //           resolvedSection.subsections = await Promise.all(
  //             section.subsections.map(async (sub) => {
  //               return await this.amendmentsService.resolveFromBase({
  //                 _id: sub._id,
  //                 title: sub.title,
  //                 content: sub.content,
  //                 level: 'SUBSECTION',
  //               });
  //             }),
  //           );

  //           return resolvedSection;
  //         }),
  //       );

  //       return resolvedPart;
  //     }),
  //   );

  //   return resolvedChapter;
  // }

  // async findTaxLawChapterByChapterId(chapterId: string) {
  //   const response =
  //     await this.taxLawsRepository.findTaxLawChapterByChapterId(chapterId);

  //   if (!response) {
  //     throw new NotFoundException({
  //       message: 'Chapter not found.',
  //       success: false,
  //       status: 404,
  //     });
  //   }

  //   // ✅ Resolve Chapter
  //   const resolvedChapter = await this.amendmentsService.resolveFromBase({
  //     _id: response._id,
  //     title: response.title,
  //     level: 'CHAPTER',
  //   });

  //   // ✅ Attach parts manually
  //   resolvedChapter.parts = await Promise.all(
  //     response.parts.map(async (part) => {
  //       const resolvedPart = await this.amendmentsService.resolveFromBase({
  //         _id: part._id,
  //         title: part.title,
  //         level: 'PART',
  //       });

  //       // ✅ Attach sections
  //       resolvedPart.sections = await Promise.all(
  //         part.sections.map(async (section) => {
  //           const resolvedSection =
  //             await this.amendmentsService.resolveFromBase({
  //               _id: section._id,
  //               title: section.title,
  //               content: section.content,
  //               level: 'SECTION',
  //             });

  //           // ✅ Attach subsections
  //           resolvedSection.subsections = await Promise.all(
  //             section.subsections.map(async (sub) => {
  //               return await this.amendmentsService.resolveFromBase({
  //                 _id: sub._id,
  //                 title: sub.title,
  //                 content: sub.content,
  //                 level: 'SUBSECTION',
  //               });
  //             }),
  //           );

  //           return resolvedSection;
  //         }),
  //       );

  //       return resolvedPart;
  //     }),
  //   );

  //   return resolvedChapter;
  // }

  async findTaxLawChapterByChapterId(chapterId: string, asOf?: Date | string) {
    const asOfDate = asOf ? new Date(asOf) : null;

    const response =
      await this.taxLawsRepository.findTaxLawChapterByChapterId(chapterId);

    if (!response) {
      throw new NotFoundException({
        message: 'Chapter not found.',
        success: false,
        status: 404,
      });
    }

    // ================================
    // 1. COLLECT ALL IDS
    // ================================
    const entityIds: string[] = [];

    entityIds.push(response._id.toString());

    for (const part of response.parts || []) {
      entityIds.push(part._id.toString());

      for (const section of part.sections || []) {
        entityIds.push(section._id.toString());

        for (const sub of section.subsections || []) {
          entityIds.push(sub._id.toString());
        }
      }
    }

    // ================================
    // 2. FETCH ALL AMENDMENTS (1 QUERY)
    // ================================
    const amendments = await this.amendmentsService.findAmendmentsByEntityIds(
      entityIds,
      asOfDate || undefined,
    );

    console.log('ENTITY IDS:', entityIds);
    console.log('AMENDMENTS FOUND:', amendments);

    // ================================
    // 3. GROUP AMENDMENTS BY entityId
    // ================================
    const amendmentMap = new Map<string, any[]>();

    for (const amendment of amendments) {
      const key = amendment.target.entityId.toString();

      if (!amendmentMap.has(key)) {
        amendmentMap.set(key, []);
      }

      amendmentMap.get(key)!.push(amendment);
    }

    // ================================
    // 4. APPLY FUNCTION (LOCAL)
    // ================================
    const applyAmendments = (entity: any) => {
      const entityAmendments = amendmentMap.get(entity._id.toString()) || [];

      let title = entity.title;
      let content = entity.content;

      // Sort by date (important!)
      // entityAmendments.sort(
      //   (a, b) =>
      //     new Date(a.effectiveDate).getTime() -
      //     new Date(b.effectiveDate).getTime(),
      // );

      for (const amendment of entityAmendments) {
        if (asOfDate && new Date(amendment.effectiveDate) > asOfDate) {
          continue;
        }

        if (amendment.type === 'MODIFY') {
          if (amendment.changes?.title !== undefined) {
            title = amendment.changes.title;
          }

          if (amendment.changes?.content !== undefined) {
            content = amendment.changes.content;
          }
        }

        if (amendment.type === 'REPEAL') {
          content = '[REPEALED]';
        }
      }

      return {
        ...entity,
        original: {
          title: entity.title,
          content: entity.content,
        },
        title,
        content,
        meta: {
          isAmended: entityAmendments.length > 0,
          amendmentCount: entityAmendments.length,
        },
      };
    };

    // ================================
    // 5. BUILD FINAL STRUCTURE
    // ================================

    const resolvedChapter = applyAmendments(response);

    resolvedChapter.parts = (response.parts || []).map((part) => {
      const resolvedPart = applyAmendments(part);

      resolvedPart.sections = (part.sections || []).map((section) => {
        const resolvedSection = applyAmendments(section);

        resolvedSection.subsections = (section.subsections || []).map((sub) =>
          applyAmendments(sub),
        );

        return resolvedSection;
      });

      return resolvedPart;
    });

    console.log('resolvedChapter:', resolvedChapter);

    return resolvedChapter;
  }

  // async getSectionHistory(sectionId: string) {
  //   // ================================
  //   // 1. FETCH SECTION + SUBSECTIONS
  //   // ================================
  //   const section =
  //     await this.taxLawsRepository.getTaxLawSectionBySectionId(sectionId);

  //   if (!section) {
  //     throw new NotFoundException({
  //       message: 'Section not found',
  //       success: false,
  //       status: 404,
  //     });
  //   }

  //   // ================================
  //   // 2. COLLECT ENTITY IDS
  //   // ================================
  //   const entityIds: string[] = [];

  //   entityIds.push(section._id.toString());

  //   for (const sub of section.subsections || []) {
  //     entityIds.push(sub._id.toString());
  //   }

  //   // ================================
  //   // 3. FETCH ALL AMENDMENTS (ONE QUERY)
  //   // ================================
  //   const amendments =
  //     await this.amendmentsService.findHistoryByEntityIds(entityIds);

  //   // ================================
  //   // 4. SORT BY DATE
  //   // ================================
  //   amendments.sort(
  //     (a, b) =>
  //       new Date(a.effectiveDate).getTime() -
  //       new Date(b.effectiveDate).getTime(),
  //   );

  //   // ================================
  //   // 5. BUILD TIMELINE
  //   // ================================
  //   const timeline = amendments.map((amendment) => ({
  //     amendmentId: amendment._id,
  //     entityId: amendment.target.entityId,
  //     target: amendment.target, // includes level (SECTION / SUBSECTION)
  //     type: amendment.type, // MODIFY | REPEAL | ADD
  //     effectiveDate: amendment.effectiveDate,
  //     description: amendment.description || null,
  //     metadata: amendment.metadata || {},
  //   }));

  //   const response = {
  //     sectionId,
  //     totalAmendments: timeline.length,
  //     timeline,
  //   };

  //   return {
  //     success: true,
  //     data: response,
  //   };
  // }

  async getSectionHistory(sectionId: string) {
    // ================================
    // 1. FETCH SECTION + SUBSECTIONS
    // ================================
    const section =
      await this.taxLawsRepository.getTaxLawSectionBySectionId(sectionId);

    if (!section) {
      throw new NotFoundException({
        message: 'Section not found',
        success: false,
        status: 404,
      });
    }

    // ================================
    // 2. COLLECT ENTITY IDS
    // ================================
    const entityIds: string[] = [
      section._id.toString(),
      ...(section.subsections || []).map((s) => s._id.toString()),
    ];

    // ================================
    // 3. FETCH AMENDMENTS
    // ================================
    const amendments =
      await this.amendmentsService.findHistoryByEntityIds(entityIds);

    // ================================
    // 4. SORT BY DATE (ASC)
    // ================================
    amendments.sort(
      (a, b) =>
        new Date(a.effectiveDate).getTime() -
        new Date(b.effectiveDate).getTime(),
    );

    // ================================
    // 5. INITIAL STATE (VERSION 0)
    // ================================
    let currentSectionContent = section.content;

    const currentSubsections: Record<string, any> = {};

    for (const sub of section.subsections || []) {
      currentSubsections[sub._id.toString()] = {
        ...(sub.toObject?.() ?? sub),
      };
    }

    const timeline: any[] = [
      {
        version: 0,
        type: 'ORIGINAL',
        effectiveDate: section.createdAt || null,
        section: {
          ...(section.toObject?.() ?? section),
          content: currentSectionContent,
        },
        subsections: Object.values(currentSubsections),
        description: 'Initial version',
        target: {
          level: 'SECTION',
        },
      },
    ];

    // ================================
    // 6. APPLY AMENDMENTS PROGRESSIVELY
    // ================================
    amendments.forEach((amendment, index) => {
      const entityId = amendment.target.entityId.toString();

      // 👉 SECTION AMENDMENT
      if (entityId === section._id.toString()) {
        if (amendment.type === 'MODIFY') {
          if (amendment.changes?.content !== undefined) {
            currentSectionContent = amendment.changes.content;
          }
        }

        if (amendment.type === 'DELETE') {
          currentSectionContent = '[REPEALED]';
        }
      }

      // 👉 SUBSECTION AMENDMENT
      if (currentSubsections[entityId]) {
        const sub = currentSubsections[entityId];

        if (amendment.type === 'MODIFY') {
          if (amendment.changes?.content !== undefined) {
            sub.content = amendment.changes.content;
          }
        }

        if (amendment.type === 'DELETE') {
          sub.content = '[REPEALED]';
        }
      }

      // ================================
      // PUSH SNAPSHOT
      // ================================
      timeline.push({
        version: index + 1,
        amendmentId: amendment._id,
        type: amendment.type,
        target: amendment.target,
        effectiveDate: amendment.effectiveDate,
        description: amendment.description || null,

        section: {
          ...(section.toObject?.() ?? section),
          content: currentSectionContent,
        },

        subsections: Object.values(currentSubsections).map((s) => ({ ...s })),
      });
    });

    // ================================
    // 7. RESPONSE
    // ================================
    return {
      success: true,
      data: {
        sectionId: section._id,
        totalVersions: timeline.length,
        timeline,
      },
    };
  }

  async getSubSectionHistory(subSectionId: string) {
    console.log('subSectionId:', subSectionId);

    // ================================
    // 1. FETCH SUBSECTION (ORIGINAL)
    // ================================
    const subSection =
      await this.taxLawsRepository.getSubSectionBySubSectionId(subSectionId);

    if (!subSection) {
      throw new NotFoundException({
        message: 'Sub section not found',
        success: false,
        status: 404,
      });
    }

    // ================================
    // 2. FETCH AMENDMENTS
    // ================================
    const amendments = await this.amendmentsService.findHistoryByEntityIds([
      subSection._id.toString(),
    ]);

    // ================================
    // 3. SORT AMENDMENTS (ASC)
    // ================================
    amendments.sort(
      (a, b) =>
        new Date(a.effectiveDate).getTime() -
        new Date(b.effectiveDate).getTime(),
    );

    // ================================
    // 4. BUILD TIMELINE
    // ================================

    // 👉 START WITH ORIGINAL DOCUMENT
    const timeline: any[] = [
      {
        version: 0,
        type: 'ORIGINAL',
        entityId: subSection._id,
        effectiveDate: subSection.createdAt || null, // fallback if exists
        content: subSection.content,
        description: 'Initial version',
        metadata: {},
      },
    ];

    // 👉 TRACK CURRENT STATE (for version building)
    let currentContent = subSection.content;

    amendments.forEach((amendment, index) => {
      // Apply amendment to build version snapshot
      if (amendment.type === 'MODIFY') {
        if (amendment.changes?.content !== undefined) {
          currentContent = amendment.changes.content;
        }
      }

      if (amendment.type === 'DELETE') {
        currentContent = '[REPEALED]';
      }

      timeline.push({
        version: index + 1,
        amendmentId: amendment._id,
        entityId: amendment.target.entityId,
        type: amendment.type,
        effectiveDate: amendment.effectiveDate,
        description: amendment.description || null,
        content: currentContent, // ✅ snapshot AFTER applying amendment
        changes: amendment.changes || null,
        metadata: amendment.metadata || {},
      });
    });

    // ================================
    // 5. RESPONSE
    // ================================
    return {
      success: true,
      data: {
        subSectionId: subSection._id,
        totalVersions: timeline.length,
        timeline,
        target: {
          level: 'SUBSECTION',
        },
      },
    };
  }
  async getChapterHistory(chapterId: string) {
    // ================================
    // 1. FETCH FULL CHAPTER TREE
    // ================================
    const chapter =
      await this.taxLawsRepository.findTaxLawChapterByChapterId(chapterId);

    if (!chapter) {
      throw new NotFoundException({
        message: 'Chapter not found',
        success: false,
        status: 404,
      });
    }

    // ================================
    // 2. COLLECT ENTITY IDS
    // ================================
    const entityIds: string[] = [];

    entityIds.push(chapter._id.toString());

    for (const part of chapter.parts || []) {
      entityIds.push(part._id.toString());

      for (const section of part.sections || []) {
        entityIds.push(section._id.toString());

        for (const sub of section.subsections || []) {
          entityIds.push(sub._id.toString());
        }
      }
    }

    // ================================
    // 3. FETCH ALL AMENDMENTS (ONE QUERY)
    // ================================
    const amendments =
      await this.amendmentsService.findHistoryByEntityIds(entityIds);

    // ================================
    // 4. SORT BY DATE (IMPORTANT)
    // ================================
    amendments.sort(
      (a, b) =>
        new Date(a.effectiveDate).getTime() -
        new Date(b.effectiveDate).getTime(),
    );

    // ================================
    // 5. BUILD TIMELINE
    // ================================
    const timeline = amendments.map((amendment) => ({
      amendmentId: amendment._id,
      entityId: amendment.target.entityId,
      target: amendment.target,
      type: amendment.type, // MODIFY | REPEAL | ADD
      effectiveDate: amendment.effectiveDate,
      description: amendment.description || null,
      metadata: amendment.metadata || {},
    }));

    const response = {
      chapterId,
      totalAmendments: timeline.length,
      timeline,
    };

    console.log('response:', response);

    return {
      success: true,
      data: response,
    };
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
