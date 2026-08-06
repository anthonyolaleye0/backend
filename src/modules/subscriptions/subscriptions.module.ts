import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeatureAccessGuard } from './guards/feature-access.guard';
import { SubscriptionPlanRepository } from './repositories/subscription-plan.repository';
import { UserSubscriptionRepository } from './repositories/user-subscription.repository';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from './schemas/subscription-plan.schema';
import {
  UserSubscription,
  UserSubscriptionSchema,
} from './schemas/user-subscription.schema';
import { PlanSeederService } from './services/plan-seeder.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: UserSubscription.name, schema: UserSubscriptionSchema },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionPlanRepository,
    UserSubscriptionRepository,
    SubscriptionsService,
    PlanSeederService,
    FeatureAccessGuard,
  ],
  exports: [
    SubscriptionsService,
    UserSubscriptionRepository,
    FeatureAccessGuard,
  ],
})
export class SubscriptionsModule {}
