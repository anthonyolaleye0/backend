import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PlanTier } from '../enums/plan-name.enum';
import { UserSubscriptionStatus } from '../enums/user-subscription-status.enum';

export type UserSubscriptionDocument = HydratedDocument<UserSubscription>;

@Schema({ timestamps: true })
export class UserSubscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubscriptionPlan', required: true })
  planId!: Types.ObjectId;

  @Prop({ required: true, enum: PlanTier })
  tier!: PlanTier;

  @Prop({
    enum: [UserSubscriptionStatus],
    default: UserSubscriptionStatus.ACTIVE,
  })
  status!: string;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true, index: true })
  endDate!: Date;

  @Prop()
  paymentProvider!: string;

  @Prop()
  paymentReference!: string;
}

export const UserSubscriptionSchema =
  SchemaFactory.createForClass(UserSubscription);

UserSubscriptionSchema.index({ userId: 1, status: 1, endDate: -1 });
