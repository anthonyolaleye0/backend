import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AmendmentDocument = HydratedDocument<Amendment>;

export type TaxLawLevels =
  | 'TAXLAW'
  | 'CHAPTER'
  | 'PART'
  | 'SECTION'
  | 'SUBSECTION';

export type AmendmentLean = {
  _id: string;
  taxLawId: string;
  target: {
    level: string;
    entityId: string;
    path?: {
      chapterNumber?: number;
      sectionNumber?: number;
      subSectionNumber?: number;
    };
  };
  type: 'INSERT' | 'DELETE' | 'MODIFY';
  content: string;
  effectiveDate: Date;
  metadata?: {
    financeAct?: string;
    year?: number;
  };
  description: string;
  amendedBy: string;
  isActive: boolean;
};

@Schema({ timestamps: true })
export class Amendment {
  /**
   * Root tax law this amendment belongs to
   */
  @Prop({ type: Types.ObjectId, ref: 'TaxLaw', required: true })
  taxLawId!: Types.ObjectId;

  /**
   * Target definition (single source of truth)
   */
  @Prop({
    type: {
      level: {
        type: String,
        enum: ['TAXLAW', 'CHAPTER', 'PART', 'SECTION', 'SUBSECTION'],
        required: true,
      },

      entityId: {
        type: Types.ObjectId,
        required: true,
      },

      // Optional fallback when structure is referenced by numbering instead of IDs
      path: {
        chapterNumber: Number,
        sectionNumber: Number,
        subSectionNumber: Number,
      },
    },
    required: true,
  })
  target!: {
    level: TaxLawLevels;
    entityId: Types.ObjectId;
    path?: {
      chapterNumber?: number;
      sectionNumber?: number;
      subSectionNumber?: number;
    };
  };

  /**
   * Amendment type
   */
  @Prop({
    required: true,
    enum: ['INSERT', 'DELETE', 'MODIFY'],
  })
  type!: 'INSERT' | 'DELETE' | 'MODIFY';

  /**
   * New or modified legal content
   */
  @Prop({
    type: {
      title: String,
      content: String,
    },
  })
  changes?: {
    title?: string;
    content?: string;
  };

  /**
   * When this amendment becomes active
   */
  @Prop({ required: true })
  effectiveDate!: Date;

  /**
   * Extra metadata (finance act, year, etc.)
   */
  @Prop({
    type: {
      financeAct: String,
      year: Number,
    },
  })
  metadata?: {
    financeAct?: string;
    year?: number;
  };

  /**
   * Human-readable description
   */
  @Prop({ required: true })
  description!: string;

  /**
   * Who made the amendment
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  amendedBy!: Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;
}

export const AmendmentSchema = SchemaFactory.createForClass(Amendment);
AmendmentSchema.index({
  'target.entityId': 1,
  effectiveDate: 1,
});
