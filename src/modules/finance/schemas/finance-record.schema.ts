// FinanceRecord.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FinanceRecordDocument = HydratedDocument<FinanceRecord>;

@Schema({ timestamps: true })
export class FinanceRecord {
  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;
}

export const FinanceRecordSchema = SchemaFactory.createForClass(FinanceRecord);
