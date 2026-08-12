import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryUserTipsDto } from '../dtos/query-user-tips.dto';
import { UserTip, UserTipDocument } from '../schemas/user-daily-tips.schema';

@Injectable()
export class UserDailyTipsRepository {
  constructor(
    @InjectModel(UserTip.name)
    private readonly userTipModel: Model<UserTipDocument>,
  ) {}

  async createDailyTipForUsers(
    tipId: Types.ObjectId,
    users: {
      _id: Types.ObjectId;
      lastName: string;
      email: string;
      firstName: string;
    }[],
  ) {
    const payload = users.map((user) => ({
      userId: user._id,
      tipId,
      isRead: false,
    }));

    const response = await this.userTipModel.insertMany(payload);

    return response;
  }

  // async getUserInbox(
  //   userId: string,
  //   queryDto: QueryUserTipsDto,
  // ): Promise<{
  //   mails: UserTipDocument[];
  //   totalCount: number;
  //   totalPages: number;
  // }> {
  //   const { page, searchParams, limit } = queryDto;

  //   let query = this.userTipModel.find({
  //     userId: new Types.ObjectId(userId),
  //     isDeleted: false,
  //   });

  //   if (queryDto.unreadOnly) {
  //     query = query.where({
  //       isRead: false,
  //     });
  //   }

  //   const count = await query.clone().countDocuments();
  //   let pages = 0;

  //   if (page !== undefined && limit !== undefined && count !== 0) {
  //     const offset = (page - 1) * limit;

  //     query = query.skip(offset).limit(limit);
  //     pages = Math.ceil(count / limit);

  //     if (page > pages) {
  //       throw new NotFoundException({
  //         message: 'Page can not be found',
  //         status: 404,
  //         success: false,
  //       });
  //     }
  //   }

  //   const mails = await query
  //     .sort({ created: -1 })
  //     .populate({
  //       path: 'tipId',
  //       select: 'title content sectionId subSectionId sentAt',
  //     })
  //     .lean()
  //     .exec();

  //   if (searchParams) {
  //     const regex = new RegExp(searchParams, 'i');

  //     query = query.where({});
  //   }
  // }

  async getUserInbox(
    userId: string,
    queryDto: QueryUserTipsDto,
  ): Promise<{
    mails: any[];
    totalCount: number;
    totalPages: number;
  }> {
    const page = Number(queryDto.page) || 1;
    const limit = Number(queryDto.limit) || 10;
    const offset = (page - 1) * limit;

    const matchStage: any = {
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    };

    // if (
    //   queryDto.unreadOnly === true ||
    //   (queryDto.unreadOnly as any) === 'true'
    // ) {
    //   matchStage.isRead = false;
    // }

    console.log('userId:', userId);

    console.log('matchStage:', matchStage);

    const pipeline: any[] = [
      { $match: matchStage },

      {
        $lookup: {
          from: 'dailytips',
          localField: 'tipId',
          foreignField: '_id',
          as: 'tipId',
        },
      },

      { $unwind: '$tipId' },
    ];

    console.log('pipeline:', pipeline);

    if (queryDto.searchParams && queryDto.searchParams.trim() !== '') {
      const searchRegex = new RegExp(queryDto.searchParams.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'tipId.title': searchRegex },
            { 'tipId.content': searchRegex },
          ],
        },
      });
    }

    const aggregationResult = await this.userTipModel.aggregate([
      ...pipeline,
      {
        $facet: {
          metadata: [{ $count: 'totalCount' }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: offset },
            { $limit: limit },
          ],
        },
      },
    ]);

    console.log('aggregationResult:', aggregationResult);

    const totalCount = aggregationResult[0]?.metadata[0]?.totalCount || 0;
    const mails = aggregationResult[0]?.data || [];
    const totalPages = Math.ceil(totalCount / limit);

    if (page > totalPages && totalCount > 0) {
      throw new NotFoundException({
        message: 'Page cannot be found',
        status: 404,
        success: false,
      });
    }

    console.log('mails:', mails);
    return {
      mails,
      totalCount,
      totalPages,
    };
  }

  async findUserTipById(
    userTipId: string,
    userId: string,
  ): Promise<UserTipDocument | null> {
    return this.userTipModel
      .findOne({
        _id: new Types.ObjectId(userTipId),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .populate({
        path: 'tipId',
        populate: { path: 'sectionId subSectionId title content' },
      })
      .exec();
  }

  async markAsRead(
    userTipId: string,
    userId: string,
  ): Promise<UserTipDocument | null> {
    const response = await this.userTipModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(userTipId),
          userId: new Types.ObjectId(userId),
        },
        { $set: { isRead: true, readAt: new Date() } },
        { returnDocument: 'after' },
      )
      .exec();

    console.log('response:', response);
    return response;
  }

  async softDeleteTip(userTipId: string, userId: string): Promise<boolean> {
    const res = await this.userTipModel.updateOne(
      {
        _id: new Types.ObjectId(userTipId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { isDeleted: true } },
    );
    return res.modifiedCount > 0;
  }
}
