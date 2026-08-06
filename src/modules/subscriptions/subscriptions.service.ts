import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UpdatePlanDto } from './dtos/update-plan.dto';
import { FeatureKey } from './enums/feature.enum';
import { PlanTier } from './enums/plan-name.enum';
import { UserSubscriptionStatus } from './enums/user-subscription-status.enum';
import { SubscriptionPlanRepository } from './repositories/subscription-plan.repository';
import { UserSubscriptionRepository } from './repositories/user-subscription.repository';
import { SubscriptionPlan } from './schemas/subscription-plan.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly planRepository: SubscriptionPlanRepository,
    private readonly userSubRepository: UserSubscriptionRepository,
  ) {}

  async getAllActivePlans(): Promise<SubscriptionPlan[]> {
    const response = await this.planRepository.findAllActive();

    return response;
  }

  async getUserCurrentSubscription(userId: string) {
    const activeSub = await this.userSubRepository.findActiveByUserId(userId);
    if (!activeSub) {
      return { hasActiveSubscription: false, subscription: null };
    }
    return { hasActiveSubscription: true, subscription: activeSub };
  }

  async userHasFeature(userId: string, feature: FeatureKey): Promise<boolean> {
    const activeSub = await this.userSubRepository.findActiveByUserId(userId);
    if (!activeSub || !activeSub.planId) {
      return false;
    }

    const plan = activeSub.planId as unknown as SubscriptionPlan;
    return plan.allowedFeatures?.includes(feature) ?? false;
  }

  async findPlanById(planId: string) {
    const response = await this.planRepository.findById(planId);

    if (!response) {
      throw new NotFoundException({
        message: 'Plan not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async createNewSub(payload: {
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    tier: PlanTier;
    status: UserSubscriptionStatus;
    startDate: Date;
    endDate: Date;
  }) {
    const response = await this.userSubRepository.createSubscription(payload);

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to create subscription.',
        success: false,
        status: 400,
      });
    }
    return response;
  }

  async updatePlan(planId: string, updatePlanDto: UpdatePlanDto) {
    const updated = await this.planRepository.updatePlan(planId, updatePlanDto);
    if (!updated)
      throw new NotFoundException({
        message: 'Subscription plan not found',
        success: false,
        status: 404,
      });
    return updated;
  }

  async deactivateActiveUserSubscription(userId: string) {
    const response =
      await this.userSubRepository.deactivateExistingActiveSubscriptions(
        userId,
      );

    return response;
  }
}
