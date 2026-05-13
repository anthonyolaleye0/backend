import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScheduleDocument = HydratedDocument<Schedule>;

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ type: Types.ObjectId, ref: 'TaxLaw', required: true })
  taxLaw!: Types.ObjectId;

  @Prop({ trim: true })
  title?: string;

  @Prop()
  number?: string;

  @Prop({ trim: true })
  content?: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
