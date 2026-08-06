import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDailyTipDocument = HydratedDocument<UserDailyTip>;

@Schema({ timestamps: true })
export class UserDailyTip {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DailyTip', required: true })
  tipId!: Types.ObjectId;

  @Prop({ default: false })
  isRead!: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ default: false })
  isDeleted!: boolean; // optional (like Gmail trash)
}

export const UserDailyTipSchema = SchemaFactory.createForClass(UserDailyTip);
