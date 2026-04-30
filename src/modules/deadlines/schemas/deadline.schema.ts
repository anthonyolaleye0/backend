import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DeadlineDocument = HydratedDocument<Deadline>;

@Schema({ timestamps: true })
export class Deadline {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  dueDate!: Date;

  @Prop()
  description!: string;
}

export const DeadlineSchema = SchemaFactory.createForClass(Deadline);
