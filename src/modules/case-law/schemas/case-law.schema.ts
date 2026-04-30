import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CaseLawDocument = HydratedDocument<CaseLaw>;

@Schema({ timestamps: true })
export class CaseLaw {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  summary!: string;

  @Prop({ type: Types.ObjectId, ref: 'TaxLaw' })
  relatedLaw!: Types.ObjectId;
}

export const CaseLawSchema = SchemaFactory.createForClass(CaseLaw);
