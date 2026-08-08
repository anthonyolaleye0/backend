import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DecidedCaseDocument = HydratedDocument<DecidedCase>;

@Schema({ timestamps: true })
export class DecidedCase {
  @Prop({ required: true, index: true, trim: true })
  suitNumber!: string; // e.g., "FCA/L/120/2021"

  @Prop({ required: true, trim: true })
  title!: string; // e.g., "FIRS vs. ABC Nigeria Ltd"

  @Prop({ required: true })
  judgmentDate!: Date;

  @Prop({ trim: true })
  court?: string; // e.g., "Tax Appeal Tribunal", "Court of Appeal"

  @Prop({ trim: true })
  summary?: string;

  @Prop({ type: [String], default: [], index: true })
  keywords!: string[]; // e.g., ["VAT", "Withholding Tax", "Exemption"]

  @Prop({ type: [{ type: Types.ObjectId, ref: 'TaxLaw' }], default: [] })
  relatedTaxLaws?: Types.ObjectId[];

  @Prop({ required: true })
  fileUrl!: string; // Secure Cloudinary URL

  @Prop({ required: true })
  filePublicId!: string; // Cloudinary Public ID for document management

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const DecidedCaseSchema = SchemaFactory.createForClass(DecidedCase);

DecidedCaseSchema.index({
  title: 'text',
  suitNumber: 'text',
  summary: 'text',
  keywords: 'text',
});
