import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeatureKey } from '../enums/feature.enum';
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

  async deactivateExistingActiveSubscriptions(userId: string): Promise<void> {
    await this.userSubModel.updateMany(
      {
        userId: new Types.ObjectId(userId.toString()),
        status: UserSubscriptionStatus.ACTIVE,
      },
      { $set: { status: UserSubscriptionStatus.EXPIRED } },
    );
  }

  async findSubscribedEmailsForDailyTips(): Promise<
    Array<{
      _id: Types.ObjectId;
      email: string;
      firstName: string;
      lastName: string;
    }>
  > {
    const now = new Date();

    const activeUsersWithDailyTips = await this.userSubModel.aggregate([
      {
        $match: {
          status: UserSubscriptionStatus.ACTIVE,
          endDate: { $gte: now },
        },
      },

      {
        $lookup: {
          from: 'subscriptionplans', // Ensure this matches your Mongoose collection name
          localField: 'planId',
          foreignField: '_id',
          as: 'plan',
        },
      },
      { $unwind: '$plan' },

      {
        $match: {
          'plan.isActive': true,
          'plan.allowedFeatures': FeatureKey.DAILY_TIPS, // Replace with your exact FeatureKey enum value
        },
      },

      // 4. Join with Users collection to get email and user details
      {
        $lookup: {
          from: 'users', // Ensure this matches your User model collection name
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },

      // 5. Ensure user account is active and not deleted
      {
        $match: {
          'user.isDeleted': { $ne: true },
        },
      },

      // 6. Group by userId to remove duplicates if a user has multiple active sub records
      {
        $group: {
          _id: '$user._id',
          email: { $first: '$user.email' },
          firstName: { $first: '$user.firstName' },
          lastName: { $first: '$user.lastName' },
        },
      },

      // 7. Project clean fields required for mailer and daily tips logger
      {
        $project: {
          _id: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
        },
      },
    ]);

    return activeUsersWithDailyTips;
  }
}
