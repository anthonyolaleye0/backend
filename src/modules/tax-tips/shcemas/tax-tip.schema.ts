import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TaxTipDocument = HydratedDocument<TaxTip>;

@Schema({ timestamps: true })
export class TaxTip {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;
}

export const TaxTipSchema = SchemaFactory.createForClass(TaxTip);
