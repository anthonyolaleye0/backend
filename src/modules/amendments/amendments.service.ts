import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { TaxLawsRepository } from '../tax-laws/repositories/tax-laws.repository';
import { TaxLawsService } from '../tax-laws/tax-laws.service';
import { CreateAmendmentDto } from './dtos/create-amendment.dto';
import { AmendmentRepository } from './repositories/amendment.repository';

@Injectable()
export class AmendmentsService {
  constructor(
    private readonly amendmentRepository: AmendmentRepository,
    private readonly taxLawsRepository: TaxLawsRepository,
    private readonly taxLawsService: TaxLawsService,
  ) {}

  // async createAmendment(dto: CreateAmendmentDto, userId: string) {
  //   console.log('dto:', dto);
  //   const taxLawId = await this.taxLawsRepository.resolveTaxLawIdFromEntity(
  //     dto.target.level,
  //     dto.target.entityId,
  //   );
  //   console.log('taxLawId:', taxLawId);

  //   const payload = {
  //     content: dto.content,
  //     description: dto.description,
  //     effectiveDate: new Date(dto.effectiveDate),
  //     metadata: dto.metadata,
  //     target: dto.target,
  //     type: dto.type,
  //     taxLawId,
  //     amendedBy: new Types.ObjectId(userId),
  //   };
  //   const response = await this.amendmentRepository.createAmendment(payload);
  //   console.log('response:', response);

  //   return response;
  // }

  async createAmendment(dto: CreateAmendmentDto, userId: string) {
    this.validateAmendment(dto);

    const taxLawId = await this.taxLawsRepository.resolveTaxLawIdFromEntity(
      dto.target.level,
      dto.target.entityId,
    );

    return this.amendmentRepository.createAmendment({
      changes: dto.changes,
      description: dto.description,
      effectiveDate: new Date(dto.effectiveDate),
      metadata: dto.metadata,
      target: dto.target,
      type: dto.type,
      taxLawId,
      amendedBy: new Types.ObjectId(userId),
    });
  }

  /**
   * CORE: Apply amendments to content
   */
  // async resolveContent(entityId: string, baseContent: string, asOf?: Date) {
  //   const amendments = await this.amendmentRepository.findApplicable(
  //     entityId,
  //     asOf,
  //   );

  //   let content = baseContent;

  //   for (const amendment of amendments) {
  //     if (amendment.type === 'MODIFY') {
  //       content = amendment.content;
  //     }

  //     if (amendment.type === 'DELETE') {
  //       content = '';
  //     }

  //     if (amendment.type === 'INSERT') {
  //       content += '\n' + amendment.content;
  //     }
  //   }

  //   return {
  //     content,
  //     meta: {
  //       isAmended: amendments.length > 0,
  //       amendmentCount: amendments.length,
  //     },
  //   };
  // }

  async resolve(entityId: string, asOf?: Date) {
    // 1. Get base entity from tax law service
    const baseEntity = await this.taxLawsService.getEntityBase(entityId);

    // 2. Get amendments
    const amendments = await this.amendmentRepository.findApplicable(
      entityId,
      asOf,
    );

    // 3. Apply amendments
    let title = baseEntity.title;
    let content = baseEntity.content;

    for (const amendment of amendments) {
      switch (amendment.type) {
        case 'MODIFY':
          if (
            amendment.target.level === 'CHAPTER' ||
            amendment.target.level === 'PART'
          ) {
            title = amendment.content;
          } else {
            content = amendment.content;
          }
          break;

        case 'DELETE':
          if (
            amendment.target.level === 'CHAPTER' ||
            amendment.target.level === 'PART'
          ) {
            title = '';
          } else {
            content = '';
          }
          break;

        case 'INSERT':
          if (content !== undefined) {
            content += '\n' + amendment.content;
          }
          break;
      }
    }

    return {
      entityId,
      level: baseEntity.level,
      title,
      content,
      meta: {
        isAmended: amendments.length > 0,
        amendmentCount: amendments.length,
      },
    };
  }

  // async resolveEntity(
  //   entityId: string,
  //   base: { title?: string; content?: string },
  //   asOf?: Date,
  // ) {
  //   const amendments = await this.amendmentRepository.findApplicable(
  //     entityId,
  //     asOf,
  //   );

  //   let result = { ...base };

  //   for (const amendment of amendments) {
  //     if (amendment.type === 'DELETE') {
  //       result = {};
  //       continue;
  //     }

  //     if (amendment.type === 'MODIFY') {
  //       if (amendment.changes?.title !== undefined) {
  //         result.title = amendment.changes.title;
  //       }

  //       if (amendment.changes?.content !== undefined) {
  //         result.content = amendment.changes.content;
  //       }
  //     }

  //     if (amendment.type === 'INSERT') {
  //       if (amendment.changes?.content) {
  //         result.content =
  //           (result.content || '') + '\n' + amendment.changes.content;
  //       }
  //     }
  //   }

  //   return {
  //     ...result,
  //     meta: {
  //       isAmended: amendments.length > 0,
  //       amendmentCount: amendments.length,
  //     },
  //   };
  // }

  private validateAmendment(dto: CreateAmendmentDto) {
    const { level } = dto.target;
    const { changes } = dto;

    if (!changes) {
      throw new Error('Changes must be provided');
    }

    if ((level === 'CHAPTER' || level === 'PART') && changes.content) {
      throw new Error('Content cannot be amended for CHAPTER or PART');
    }

    if (
      (level === 'SECTION' || level === 'SUBSECTION') &&
      !changes.title &&
      !changes.content
    ) {
      throw new Error('At least title or content must be provided');
    }
  }
}
