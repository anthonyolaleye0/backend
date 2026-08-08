import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateDecidedCaseDto } from '../dtos/create-decided-case.dto';
import { QueryDecidedCasesDto } from '../dtos/query-decided-case.dto';
import {
  DecidedCase,
  DecidedCaseDocument,
} from '../schemas/deicded-case.schema';

@Injectable()
export class DecidedCaseRepository {
  constructor(
    @InjectModel(DecidedCase.name)
    private caseModel: Model<DecidedCaseDocument>,
  ) {}

  async createCase(
    dto: CreateDecidedCaseDto,
    cloudinaryData: { fileUrl: string; filePublicId: string },
  ): Promise<DecidedCaseDocument> {
    const response = await this.caseModel.create({
      ...dto,
      judgmentDate: new Date(dto.judgmentDate),
      relatedTaxLaws:
        dto.relatedTaxLaws?.map((id) => new Types.ObjectId(id)) || [],
      keywords: dto.keywords || [],
      fileUrl: cloudinaryData.fileUrl,
      filePublicId: cloudinaryData.filePublicId,
    });

    return response;
  }

  async findAllCases(queryDto: QueryDecidedCasesDto) {
    const page = Number(queryDto.page) || 1;
    const limit = Number(queryDto.limit) || 10;
    const offset = (page - 1) * limit;

    const filter: any = { isDeleted: false };

    if (queryDto.court) {
      filter.court = { $regex: queryDto.court, $options: 'i' };
    }

    // Search across Title, SuitNumber, Summary, and Keywords
    if (queryDto.searchParams) {
      const searchRegex = new RegExp(queryDto.searchParams, 'i');
      filter.$or = [
        { title: searchRegex },
        { suitNumber: searchRegex },
        { summary: searchRegex },
        { keywords: searchRegex },
      ];
    }

    const [cases, totalCount] = await Promise.all([
      this.caseModel
        .find(filter)
        .select('-filePublicId') // Exclude sensitive internal credentials
        .sort({ judgmentDate: -1 })
        .skip(offset)
        .limit(limit)
        .populate('relatedTaxLaws', 'title year')
        .lean()
        .exec(),

      this.caseModel.countDocuments(filter),
    ]);

    return {
      cases,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit,
    };
  }

  async findCaseById(id: string): Promise<DecidedCaseDocument | null> {
    const response = await this.caseModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
      .populate('relatedTaxLaws', 'title year')
      .exec();

    return response;
  }

  async softDeleteCase(id: string): Promise<DecidedCaseDocument | null> {
    const response = await this.caseModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id) },
        { $set: { isDeleted: true } },
        { returnDocument: 'after' },
      )
      .exec();

    return response;
  }
}
