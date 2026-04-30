import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// @Schema({ timestamps: true })
// export class Section extends Document {
//   @Prop({ type: Types.ObjectId, ref: 'TaxLaw', required: true })
//   taxLawId!: Types.ObjectId;

//   @Prop({ required: true })
//   sectionNumber!: number; // 1, 2, 3

//   @Prop()
//   sectionTitle?: string; // "Imposition of Tax"

//   @Prop({ required: true })
//   content!: string; // section intro text

//   @Prop({ default: 0 })
//   totalSubSections!: number;
// }

export type SectionDocument = HydratedDocument<Section>;

@Schema({ timestamps: true })
export class Section {
  @Prop({ type: Types.ObjectId, ref: 'Part', required: true })
  part!: Types.ObjectId;

  @Prop()
  title?: string;

  @Prop()
  number?: string; // e.g. "Section 12"

  @Prop()
  content?: string;
}

export const SectionSchema = SchemaFactory.createForClass(Section);
SectionSchema.index({ number: 1 });
