import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DailyTipDocument = HydratedDocument<DailyTip>;

@Schema({ timestamps: true })
export class DailyTip {
  @Prop({ type: Types.ObjectId, required: true })
  sectionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  subSectionId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true })
  sentAt!: Date;

  @Prop({ default: 0 })
  totalRecipients!: number;
}

export const DailyTipSchema = SchemaFactory.createForClass(DailyTip);
