import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ReferenceType {
  SECTION = 'SECTION',
  SUBSECTION = 'SUBSECTION',
}

export type SearchIndexDocument = HydratedDocument<SearchIndex>;

@Schema()
export class SearchIndex {
  @Prop({ type: Types.ObjectId, ref: 'TaxLaw', required: true })
  taxLawId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Section', required: true })
  sectionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubSection', required: true })
  subSectionId!: Types.ObjectId;

  @Prop({ required: true, enum: ReferenceType })
  referenceType!: ReferenceType;

  @Prop()
  sectionNumber?: string;

  @Prop()
  subSectionNumber?: string;
}

export const SearchIndexSchema = SchemaFactory.createForClass(SearchIndex);

SearchIndexSchema.index({
  content: 'text',
  sectionNumber: 'text',
  subSectionNumber: 'text',
});
