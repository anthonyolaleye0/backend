import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AmendmentType, TargetDto } from '../dtos/create-amendment.dto';
import {
  Amendment,
  AmendmentDocument,
  AmendmentLean,
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
    description: string;
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
