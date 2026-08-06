import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserSubscriptionStatus } from '../enums/user-subscription-status.enum';
import {
  UserSubscription,
  UserSubscriptionDocument,
} from '../schemas/user-subscription.schema';

@Injectable()
export class UserSubscriptionRepository {
  constructor(
    @InjectModel(UserSubscription.name)
    private userSubModel: Model<UserSubscriptionDocument>,
  ) {}

  async findActiveByUserId(
    userId: string,
  ): Promise<UserSubscriptionDocument | null> {
    const response = await this.userSubModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: UserSubscriptionStatus.ACTIVE,
        endDate: { $gte: new Date() },
      })
      .populate('planId')
      .exec();

    return response;
  }

  async createSubscription(
    data: Partial<UserSubscription>,
  ): Promise<UserSubscriptionDocument> {
    const response = await this.userSubModel.create(data);

    return response;
  }

  async deactivateExistingActiveSubscriptions(
    userId: string | Types.ObjectId,
  ): Promise<void> {
    await this.userSubModel.updateMany(
      {
        userId: new Types.ObjectId(userId.toString()),
        status: UserSubscriptionStatus.ACTIVE,
      },
      { $set: { status: UserSubscriptionStatus.EXPIRED } },
    );
  }
}
