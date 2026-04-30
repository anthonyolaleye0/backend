import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScheduleDocument = HydratedDocument<Schedule>;

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ type: Types.ObjectId, ref: 'TaxLaw', required: true })
  taxLaw!: Types.ObjectId;

  @Prop()
  title?: string;

  @Prop()
  number?: string;

  @Prop()
  content?: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
