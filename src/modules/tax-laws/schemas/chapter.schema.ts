import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChapterDocument = HydratedDocument<Chapter>;

@Schema({ timestamps: true })
export class Chapter {
  @Prop({ type: Types.ObjectId, ref: 'TaxLaw', required: true })
  taxLaw!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  number?: string; // e.g. "CHAPTER I"

  @Prop()
  content?: string;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
ChapterSchema.index({ number: 1 });
