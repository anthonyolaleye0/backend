import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AmendmentDocument = HydratedDocument<Amendment>;

@Schema({ timestamps: true })
export class Amendment {
  @Prop({ type: Types.ObjectId, ref: 'TaxLaw', required: true })
  taxLawId!: Types.ObjectId;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  amendedBy!: Types.ObjectId;
}

export const AmendmentSchema = SchemaFactory.createForClass(Amendment);
