import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { PaymentProvider } from '../payment/enums/payment-provider.enum';
import { PaymentService } from '../payment/payment.service';
import { UsersService } from '../users/users.service';
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
    private readonly usersService: UsersService,

    @Inject(forwardRef(() => PaymentService))
    private readonly paymentsService: PaymentService,
  ) {}

  async getAllActivePlans(): Promise<SubscriptionPlan[]> {
    const response = await this.planRepository.findAllActive();

    return response;
  }

  async getUserCurrentSubscription(userId: string) {
    const activeSub = await this.userSubRepository.findActiveByUserId(userId);

    console.log('activeSub:', activeSub);
    if (!activeSub) {
      return { hasActiveSubscription: false, subscription: null };
    }
    return { hasActiveSubscription: true, subscription: activeSub };
  }
  async subscribeToPlan(user: JwtUser, planId: string) {
    console.log('user:', user);
    console.log('planId:', planId);

    const userExist = await this.usersService.findUserById(user.sub.toString());

    console.log('userExist:', userExist);

    const plan = await this.planRepository.findById(planId);

    if (!plan) {
      throw new NotFoundException({
        message: 'Plan not found.',
        success: false,
        status: 404,
      });
    }

    const payload = {
      planId: plan._id,
      email: userExist.email,
      amount: plan.amount,
      userId: userExist._id,
    };

    const provider = PaymentProvider.PAYSTACK;

    const paymentIntent = await this.paymentsService.createPaymentIntent(
      provider,
      payload,
    );

    return paymentIntent;
  }
  async getUserActiveSubscription(userId: string) {
    const activeSub = await this.userSubRepository.findActiveByUserId(userId);

    console.log('activeSub:', activeSub);

    return activeSub;
  }

  async userHasFeature(userId: string, feature: FeatureKey): Promise<boolean> {
    const activeSub = await this.userSubRepository.findActiveByUserId(userId);
    if (
      !activeSub ||
      !activeSub.subscription ||
      !activeSub.subscription.planId
    ) {
      return false;
    }

    const plan = activeSub.subscription.planId as unknown as SubscriptionPlan;
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

  async findSubscribedEmailsForDailyTips() {
    const response =
      await this.userSubRepository.findSubscribedEmailsForDailyTips();

    if (!response) {
      throw new NotFoundException({
        message: 'Nobody has subscribed to daily tips yet.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
}
