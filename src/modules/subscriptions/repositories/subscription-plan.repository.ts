import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlanTier } from '../enums/plan-name.enum';
import {
  SubscriptionPlan,
  SubscriptionPlanDocument,
} from '../schemas/subscription-plan.schema';

@Injectable()
export class SubscriptionPlanRepository {
  constructor(
    @InjectModel(SubscriptionPlan.name)
    private planModel: Model<SubscriptionPlanDocument>,
  ) {}

  async findAllActive(): Promise<SubscriptionPlan[]> {
    const response = await this.planModel
      .find({ isActive: true })
      .lean()
      .exec();

    return response;
  }

  async findByTier(tier: PlanTier): Promise<SubscriptionPlanDocument | null> {
    const response = await this.planModel
      .findOne({ tier, isActive: true })
      .exec();

    return response;
  }

  async findById(planId: string): Promise<SubscriptionPlanDocument | null> {
    const id = new Types.ObjectId(planId);
    const response = await this.planModel.findById(id).exec();

    return response;
  }

  async upsertDefaultPlan(
    planData: Partial<SubscriptionPlan>,
  ): Promise<SubscriptionPlanDocument> {
    const response = await this.planModel
      .findOneAndUpdate(
        { tier: planData.tier },
        { $setOnInsert: planData },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();

    return response;
  }

  async updatePlan(
    planId: string,
    updateData: Partial<SubscriptionPlan>,
  ): Promise<SubscriptionPlanDocument | null> {
    const id = new Types.ObjectId(planId);

    const response = await this.planModel
      .findByIdAndUpdate(id, { $set: updateData }, { returnDocument: 'after' })
      .exec();

    return response;
  }
}
