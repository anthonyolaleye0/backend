import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AmendmentType, TargetDto } from '../dtos/create-amendment.dto';
import {
  Amendment,
  AmendmentDocument,
  AmendmentLean,
  ResolvedEntity,
} from '../schemas/amendment.schema';

@Injectable()
export class AmendmentRepository {
  constructor(
    @InjectModel(Amendment.name)
    private readonly amendmentModel: Model<AmendmentDocument>,
  ) {}

  async createAmendment(data: {
    changes?: {
      title?: string;
      content?: string;
    };
    description?: string;
    effectiveDate: Date;
    metadata?: {
      financeAct?: string;
      year?: number;
    };
    target: TargetDto;
    type: AmendmentType;
    taxLawId: Types.ObjectId;
    amendedBy: Types.ObjectId;
  }) {
    const response = await new this.amendmentModel(data).save();

    console.log('response:', response);
    return response;
  }

  async findAmendmentsByEntity(entityId: string): Promise<AmendmentDocument[]> {
    const response = await this.amendmentModel
      .find({
        'target.entityId': entityId,
        isActive: true,
      })
      .sort({ effectiveDate: 1 });

    return response;
  }

  async findHistoryByEntityIds(entityIds: string[], asOf?: Date) {
    const query: any = {
      'target.entityId': { $in: entityIds },
    };

    if (asOf) {
      query.effectiveDate = { $lte: asOf };
    }

    return this.amendmentModel.find(query).lean();
  }

  async findAmendmentsByEntityIds(
    entityIds: Types.ObjectId[],
    asOf?: Date,
  ): Promise<AmendmentLean[]> {
    const amendments = await this.amendmentModel
      .find({
        'target.entityId': { $in: entityIds },
        ...(asOf && { effectiveDate: { $lte: asOf } }),
      })
      .sort({ effectiveDate: 1 })
      .lean<AmendmentLean[]>();

    return amendments;
  }

  async findAmendmentsByTaxLaw(taxLawId: string): Promise<AmendmentDocument[]> {
    const response = await this.amendmentModel.find({
      taxLawId,
      isActive: true,
    });

    return response;
  }

  async findApplicable(
    entityId: string,
    asOf?: Date,
  ): Promise<AmendmentLean[]> {
    const query: any = {
      'target.entityId': entityId,
      isActive: true,
    };

    if (asOf) {
      query.effectiveDate = { $lte: asOf };
    }

    return await this.amendmentModel
      .find(query)
      .sort({ effectiveDate: 1 })
      .lean<AmendmentLean[]>()
      .exec();
  }

  async findApplicableFromBase(
    entityId: string,
    asOf?: Date,
  ): Promise<ResolvedEntity[]> {
    const query: any = {
      'target.entityId': entityId,
      isActive: true,
    };

    if (asOf) {
      query.effectiveDate = { $lte: asOf };
    }

    return await this.amendmentModel
      .find(query)
      .sort({ effectiveDate: 1 })
      .lean<ResolvedEntity[]>()
      .exec();
  }

  // async findApplicable(entityId: string, asOf?: Date) {
  //   const query: any = {
  //     'target.entityId': entityId,
  //     isActive: true,
  //   };

  //   if (asOf) {
  //     query.effectiveDate = { $lte: asOf };
  //   }

  //   return this.amendmentModel.find(query).sort({ effectiveDate: 1 });
  // }
}
