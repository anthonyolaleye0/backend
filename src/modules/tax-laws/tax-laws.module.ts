import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentProcessingModule } from '../document-processing/document-processing.module';
import { TaxLawProcessor } from './processors/tax-law.processor';
import { TaxLawsRepository } from './repositories/tax-laws.repository';
import { Chapter, ChapterSchema } from './schemas/chapter.schema';
import { Part, PartSchema } from './schemas/part.schema';
import { Schedule, ScheduleSchema } from './schemas/schedule.schema';
import { SearchIndex, SearchIndexSchema } from './schemas/search-index.schema';
import { Section, SectionSchema } from './schemas/section.schema';
import { SubSection, SubSectionSchema } from './schemas/sub-section.schema';
import { TaxLaw, TaxLawSchema } from './schemas/tax-law.schema';
import { TaxLawParserService } from './tax-law-parser.service';
import { TaxLawsController } from './tax-laws.controller';
import { TaxLawsService } from './tax-laws.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaxLaw.name, schema: TaxLawSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Part.name, schema: PartSchema },
      { name: Section.name, schema: SectionSchema },
      { name: SubSection.name, schema: SubSectionSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: SearchIndex.name, schema: SearchIndexSchema },
    ]),
    BullModule.registerQueue({
      name: 'tax-law-queue',
    }),
    DocumentProcessingModule,
  ],
  controllers: [TaxLawsController],
  providers: [
    TaxLawsService,
    TaxLawsRepository,
    TaxLawParserService,
    TaxLawProcessor,
  ],
})
export class TaxLawsModule {}
