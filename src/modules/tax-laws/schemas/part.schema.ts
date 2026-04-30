import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PartDocument = HydratedDocument<Part>;
@Schema({ timestamps: true })
export class Part {
  @Prop({ type: Types.ObjectId, ref: 'Chapter', required: true })
  chapter!: Types.ObjectId;

  @Prop()
  title?: string;

  @Prop()
  number?: string; // e.g. "PART II"
}

export const PartSchema = SchemaFactory.createForClass(Part);
