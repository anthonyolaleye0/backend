import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SubSectionDocument = HydratedDocument<SubSection>;

@Schema({ timestamps: true })
export class SubSection {
  @Prop({ type: Types.ObjectId, ref: 'Section', required: true })
  section!: Types.ObjectId;

  @Prop()
  number?: string; // e.g. "(1)", "(a)", "(i)"

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;

  @Prop({ trim: true })
  content?: string;

  @Prop({ required: true })
  order!: number;
}

export const SubSectionSchema = SchemaFactory.createForClass(SubSection);
SubSectionSchema.index({ number: 1 });
