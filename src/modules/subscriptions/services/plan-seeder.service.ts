import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DEFAULT_PLANS } from '../constants/default-plans.constant';
import { SubscriptionPlanRepository } from '../repositories/subscription-plan.repository';

@Injectable()
export class PlanSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PlanSeederService.name);

  constructor(private readonly planRepository: SubscriptionPlanRepository) {}

  async onApplicationBootstrap() {
    for (const planData of DEFAULT_PLANS) {
      await this.planRepository.upsertDefaultPlan(planData);
    }
    this.logger.log('Subscription plans synchronized successfully.');
  }
}
