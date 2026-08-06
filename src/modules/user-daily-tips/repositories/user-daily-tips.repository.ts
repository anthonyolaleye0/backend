import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserDailyTip,
  UserDailyTipDocument,
} from '../schemas/user-daily-tips.schema';

@Injectable()
export class UserDailyTipsRepository {
  constructor(
    @InjectModel(UserDailyTip.name)
    private readonly userDailyTipsModel: Model<UserDailyTipDocument>,
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
    }));

    const response = await this.userDailyTipsModel.insertMany(payload);

    return response;
  }
}
