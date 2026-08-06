import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { FeatureKey } from '../enums/feature.enum';
import { PlanTier } from '../enums/plan-name.enum';

export type SubscriptionPlanDocument = HydratedDocument<SubscriptionPlan>;

@Schema({ timestamps: true })
export class SubscriptionPlan {
  @Prop({ required: true, enum: PlanTier, unique: true })
  tier!: PlanTier;

  @Prop({ required: true })
  name!: string; // e.g., "Basic Plan", "Premium Plan"

  @Prop({ required: true })
  amount!: number;

  @Prop()
  description?: string;

  @Prop({ default: 'YEARLY' })
  billingCycle!: string;

  @Prop({ required: true, default: 365 })
  durationInDays!: number; // 365 for yearly

  @Prop({ type: [String], enum: FeatureKey, default: [] })
  allowedFeatures!: FeatureKey[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);
