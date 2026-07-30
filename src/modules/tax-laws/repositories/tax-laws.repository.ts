import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { TaxLawLevels } from '../../amendments/schemas/amendment.schema';
import { DailyTipsRepository } from '../../daily-tips/repositories/daily-tips.repository';
import { Role } from '../../users/schemas/user.schema';
import { CreateChapterDto } from '../dtos/create-chapter.dto';
import { CreatePartDto } from '../dtos/create-part.dto';
import { CreateScheduleDto } from '../dtos/create-schedule.dto';
import { CreateSectionDto } from '../dtos/create-section.dto';
import { CreateSubSectionDto } from '../dtos/create-subsection.dto';
import { CreateTaxLawDto } from '../dtos/create-taxlaw.dto';
import { Chapter, ChapterDocument } from '../schemas/chapter.schema';
import { Part, PartDocument } from '../schemas/part.schema';
import { Schedule, ScheduleDocument } from '../schemas/schedule.schema';
import {
  SearchIndex,
  SearchIndexDocument,
} from '../schemas/search-index.schema';
import { Section, SectionDocument } from '../schemas/section.schema';
import { SubSection, SubSectionDocument } from '../schemas/sub-section.schema';
import {
  TaxLaw,
  TaxLawDocument,
  TaxLawStatus,
} from '../schemas/tax-law.schema';

@Injectable()
export class TaxLawsRepository {
  constructor(
    @InjectModel(TaxLaw.name)
    private readonly taxLawModel: Model<TaxLawDocument>,

    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,

    @InjectModel(Part.name)
    private readonly partModel: Model<PartDocument>,

    @InjectModel(Section.name)
    private readonly sectionModel: Model<SectionDocument>,

    @InjectModel(SubSection.name)
    private readonly subSectionModel: Model<SubSectionDocument>,

    @InjectModel(Schedule.name)
    private readonly scheduleModel: Model<ScheduleDocument>,

    @InjectModel(SearchIndex.name)
    private readonly searchIndexModel: Model<SearchIndexDocument>,

    @InjectConnection()
    private readonly connection: Connection,

    @Inject(forwardRef(() => DailyTipsRepository))
    private readonly dailyTipsRepository: DailyTipsRepository,
  ) {}

  async getTaxLawScheduleByScheduleId(scheduleId: string) {
    const id = new Types.ObjectId(scheduleId);
    const schedule = await this.scheduleModel.findById(id);

    console.log('schedule:', schedule);
    return schedule;
  }

  async createFullTaxLawDocumentWithArray(parsed: any) {
    try {
      // 1️⃣ Create the Parent TaxLaw first
      const taxLaw = await this.taxLawModel.create({
        title: parsed.title,
        year: parsed.year,
        description: parsed.description,
      });

      let totalSectionsCount = 0;
      const chapterIds: any[] = [];

      // Process one chapter at a time to stay safe with memory
      for (const ch of parsed.chapters || []) {
        const chapter = await this.chapterModel.create({
          taxLaw: taxLaw._id,
          title: ch.title,
          number: ch.number,
        });
        chapterIds.push(chapter._id);

        const partIds: any[] = [];

        for (const pt of ch.parts || []) {
          const part = await this.partModel.create({
            chapter: chapter._id,
            title: pt.title,
            number: pt.number,
          });
          partIds.push(part._id);

          // Prepare Sections
          const sectionData = pt.sections.map((sec) => ({
            part: part._id,
            title: sec.title,
            number: sec.number,
            content: sec.content,
            subsections: [],
          }));

          // Insert Sections and use .lean() or POJO to save RAM
          const createdSections =
            await this.sectionModel.insertMany(sectionData);
          totalSectionsCount += createdSections.length;

          const allSubsections: any[] = [];

          // Use a Map to associate section number with the new MongoDB ID
          const sectionNumberToIdMap = new Map();
          createdSections.forEach((s, index) => {
            sectionNumberToIdMap.set(pt.sections[index].number, s._id);
          });

          pt.sections.forEach((sec) => {
            const sectionId = sectionNumberToIdMap.get(sec.number);
            if (sec.subsections?.length > 0) {
              sec.subsections.forEach((s) => {
                allSubsections.push({
                  section: sectionId,
                  number: s.number,
                  content: s.content,
                });
              });
            }
          });

          if (allSubsections.length > 0) {
            const createdSubs =
              await this.subSectionModel.insertMany(allSubsections);

            // Group subsections by sectionId for bulk update
            const subMap = new Map();
            createdSubs.forEach((sub) => {
              const sId = sub.section.toString();
              if (!subMap.has(sId)) subMap.set(sId, []);
              subMap.get(sId).push(sub._id);
            });

            const bulkUpdateOps = createdSections.map((secDoc) => ({
              updateOne: {
                filter: { _id: secDoc._id },
                update: {
                  $set: {
                    subsections: subMap.get(secDoc._id.toString()) || [],
                  },
                },
              },
            }));

            await this.sectionModel.bulkWrite(bulkUpdateOps);
          }

          // Link Sections to Part
          await this.partModel.updateOne(
            { _id: part._id },
            { sections: createdSections.map((s) => s._id) },
          );
        }

        // Link Parts to Chapter
        await this.chapterModel.updateOne(
          { _id: chapter._id },
          { parts: partIds },
        );
      }

      // Handle Schedules
      const scheduleIds: any[] = [];
      if (parsed.schedules?.length) {
        const createdSchedules = await this.scheduleModel.insertMany(
          parsed.schedules.map((sch) => ({ ...sch, taxLaw: taxLaw._id })),
        );
        scheduleIds.push(...createdSchedules.map((s) => s._id));
      }

      // Final Tax Law Update
      await this.taxLawModel.updateOne(
        { _id: taxLaw._id },
        {
          chapters: chapterIds,
          schedules: scheduleIds,
          totalSections: totalSectionsCount,
        },
      );

      return taxLaw;
    } catch (error) {
      console.error('FAILED TO PROCESS TAX ACT:', error);
      // You might want to delete the taxLaw entry here if it failed mid-way
      throw error;
    }
  }

  async findTaxLawByTitle(title: string) {
    const response = await this.taxLawModel.findOne({
      title: title.trim(),
    });

    return response;
  }

  async createTaxLaw(payload: CreateTaxLawDto) {
    const newLaw = await new this.taxLawModel(payload).save();

    return newLaw;
  }

  async getTaxLawSubSectionBySubSectionId(subSectionId: string) {
    const response = await this.subSectionModel.findOne({
      _id: new Types.ObjectId(subSectionId),
    });

    return response;
  }

  async createFullTaxLawDocumentWithoutTransaction(parsed: any) {
    try {
      // 1️⃣ Create the Parent TaxLaw
      // We only store 'totalSections' here; 'chapters' and 'schedules' arrays are removed.
      const taxLaw = await this.taxLawModel.create({
        title: parsed.title,
        year: parsed.year,
        description: parsed.description,
        totalSections: 0, // Will update this at the very end
      });

      let totalSectionsCount = 0;

      console.log('parsed.chapters[0]:', parsed.chapters[0]);
      console.log('parsed.chapters[0].parts[0]:', parsed.chapters[0].parts[0]);
      console.log('parsed.chapters[0].parts[0]:', parsed.chapters[0].parts[0]);

      for (const ch of parsed.chapters || []) {
        // 2️⃣ Create Chapter (Points to TaxLaw)
        const chapter = await this.chapterModel.create({
          taxLaw: taxLaw._id,
          title: ch.title,
          number: ch.number,
        });

        for (const pt of ch.parts || []) {
          // 3️⃣ Create Part (Points to Chapter)
          const part = await this.partModel.create({
            chapter: chapter._id,
            title: pt.title,
            number: pt.number,
          });

          // 4️⃣ Prepare Sections (Points to Part)
          const sectionData = pt.sections.map((sec) => ({
            part: part._id,
            taxLaw: taxLaw._id, // Adding TaxLaw ID here makes global searches much faster
            title: sec.title,
            number: sec.number,
            content: sec.content,
          }));

          const createdSections =
            await this.sectionModel.insertMany(sectionData);
          totalSectionsCount += createdSections.length;

          // 5️⃣ Prepare Subsections (Points to Section)
          const allSubsections: any[] = [];

          // Map section numbers to the newly created MongoDB IDs for linking
          const sectionNumToIdMap = new Map();
          createdSections.forEach((s, index) => {
            sectionNumToIdMap.set(pt.sections[index].number, s._id);
          });

          pt.sections.forEach((sec) => {
            const sectionId = sectionNumToIdMap.get(sec.number);
            if (sec.subsections?.length > 0) {
              sec.subsections.forEach((sub) => {
                allSubsections.push({
                  section: sectionId,
                  number: sub.number,
                  content: sub.content,
                });
              });
            }
          });

          // 6️⃣ Bulk Insert Subsections
          if (allSubsections.length > 0) {
            await this.subSectionModel.insertMany(allSubsections);
          }

          // Note: No more bulkUpdate on Section, and no more updateOne on Part!
        }
        // Note: No more updateOne on Chapter!
      }

      // 7️⃣ Handle Schedules (Points to TaxLaw)
      if (parsed.schedules?.length > 0) {
        await this.scheduleModel.insertMany(
          parsed.schedules.map((sch) => ({ ...sch, taxLaw: taxLaw._id })),
        );
      }

      // 8️⃣ Final simple update for the count
      await this.taxLawModel.updateOne(
        { _id: taxLaw._id },
        { totalSections: totalSectionsCount },
      );

      return taxLaw;
    } catch (error) {
      console.error('FAILED TO PROCESS TAX ACT:', error);
      throw error;
    }
  }

  async createFullTaxLawDocument(parsed: any) {
    // 1️⃣ Start the Session
    const session = await this.taxLawModel.db.startSession();
    session.startTransaction();

    try {
      // 2️⃣ Create the Parent TaxLaw
      // Pass { session } to every operation to keep it within the atomic transaction
      const [taxLaw] = await this.taxLawModel.create(
        [
          {
            title: parsed.title,
            year: parsed.year,
            description: parsed.description,
            totalSections: 0,
          },
        ],
        { session },
      );

      let totalSectionsCount = 0;

      for (const ch of parsed.chapters || []) {
        // 3️⃣ Create Chapter
        const [chapter] = await this.chapterModel.create(
          [
            {
              taxLaw: taxLaw._id,
              title: ch.title,
              number: ch.number,
            },
          ],
          { session },
        );

        for (const pt of ch.parts || []) {
          // 4️⃣ Create Part
          const [part] = await this.partModel.create(
            [
              {
                chapter: chapter._id,
                title: pt.title,
                number: pt.number,
              },
            ],
            { session },
          );

          // 5️⃣ Prepare Sections
          const sectionData = pt.sections.map((sec) => ({
            part: part._id,
            taxLaw: taxLaw._id,
            title: sec.title,
            number: sec.number,
            content: sec.content,
          }));

          const createdSections = await this.sectionModel.insertMany(
            sectionData,
            { session },
          );
          totalSectionsCount += createdSections.length;

          // 6️⃣ Prepare Subsections
          const allSubsections: any[] = [];
          const sectionNumToIdMap = new Map();

          createdSections.forEach((s, index) => {
            sectionNumToIdMap.set(pt.sections[index].number, s._id);
          });

          pt.sections.forEach((sec) => {
            const sectionId = sectionNumToIdMap.get(sec.number);
            if (sec.subsections?.length > 0) {
              sec.subsections.forEach((sub) => {
                allSubsections.push({
                  section: sectionId,
                  number: sub.number,
                  content: sub.content,
                });
              });
            }
          });

          // 7️⃣ Bulk Insert Subsections
          if (allSubsections.length > 0) {
            await this.subSectionModel.insertMany(allSubsections, { session });
          }
        }
      }

      // 8️⃣ Handle Schedules
      if (parsed.schedules?.length > 0) {
        await this.scheduleModel.insertMany(
          parsed.schedules.map((sch) => ({ ...sch, taxLaw: taxLaw._id })),
          { session },
        );
      }

      // 9️⃣ Final update for the count
      await this.taxLawModel.updateOne(
        { _id: taxLaw._id },
        { totalSections: totalSectionsCount },
        { session },
      );

      // 🔟 Commit the Transaction
      await session.commitTransaction();
      return taxLaw;
    } catch (error) {
      // 1️⃣1️⃣ Rollback the Transaction on failure
      await session.abortTransaction();
      console.error(
        'FAILED TO PROCESS TAX ACT. TRANSACTION ROLLED BACK:',
        error,
      );
      throw error;
    } finally {
      // 1️⃣2️⃣ Always end the session
      await session.endSession();
    }
  }

  async search() {}

  async getTaxLawStructureByTaxId(taxLawId: string) {
    const id = new Types.ObjectId(taxLawId);

    const structure = await this.taxLawModel.aggregate([
      {
        $match: { _id: id },
      },

      // CHAPTERS
      {
        $lookup: {
          from: 'chapters',
          localField: '_id',
          foreignField: 'taxLaw',
          as: 'chapters',
        },
      },

      { $unwind: '$chapters' },

      // PARTS
      {
        $lookup: {
          from: 'parts',
          localField: 'chapters._id',
          foreignField: 'chapter',
          as: 'parts',
        },
      },

      // SECTIONS
      {
        $lookup: {
          from: 'sections',
          localField: 'parts._id',
          foreignField: 'part',
          as: 'sections',
        },
      },

      // ATTACH SECTIONS TO PARTS
      {
        $addFields: {
          'chapters.parts': {
            $map: {
              input: '$parts',
              as: 'part',
              in: {
                _id: '$$part._id',
                number: '$$part.number',
                title: '$$part.title',
                sections: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$sections',
                        as: 'sec',
                        cond: { $eq: ['$$sec.part', '$$part._id'] },
                      },
                    },
                    as: 'sec',
                    in: {
                      _id: '$$sec._id',
                      number: '$$sec.number',
                      title: '$$sec.title',
                    },
                  },
                },
              },
            },
          },
        },
      },

      // CLEAN UP (REMOVE TEMP FIELDS)
      {
        $project: {
          parts: 0,
          sections: 0,
        },
      },

      // GROUP BACK
      {
        $group: {
          _id: '$_id',
          title: { $first: '$title' },
          chapters: {
            $push: {
              _id: '$chapters._id',
              number: '$chapters.number',
              title: '$chapters.title',
              parts: '$chapters.parts',
            },
          },
        },
      },

      // SORT CHAPTERS (optional)
      {
        $addFields: {
          chapters: {
            $sortArray: {
              input: '$chapters',
              sortBy: { number: 1 },
            },
          },
        },
      },
    ]);

    return structure[0] || null;
  }

  // async findTaxLawChapterByChapterId(chapterId: string) {
  //   const id = new Types.ObjectId(chapterId);

  //   const result = await this.chapterModel.aggregate([
  //     {
  //       $match: { _id: id },
  //     },

  //     // 🔹 Join Parts
  //     {
  //       $lookup: {
  //         from: 'parts',
  //         localField: '_id',
  //         foreignField: 'chapter',
  //         as: 'parts',
  //       },
  //     },

  //     // 🔹 Join Sections inside each Part
  //     {
  //       $lookup: {
  //         from: 'sections',
  //         localField: 'parts._id',
  //         foreignField: 'part',
  //         as: 'sections',
  //       },
  //     },

  //     // 🔹 Join Subsections
  //     {
  //       $lookup: {
  //         from: 'subsections',
  //         localField: 'sections._id',
  //         foreignField: 'section',
  //         as: 'subsections',
  //       },
  //     },

  //     // 🔥 Restructure (VERY IMPORTANT)
  //     {
  //       $addFields: {
  //         parts: {
  //           $map: {
  //             input: '$parts',
  //             as: 'part',
  //             in: {
  //               _id: '$$part._id',
  //               title: '$$part.title',
  //               number: '$$part.number',

  //               sections: {
  //                 $map: {
  //                   input: {
  //                     $filter: {
  //                       input: '$sections',
  //                       as: 'sec',
  //                       cond: { $eq: ['$$sec.part', '$$part._id'] },
  //                     },
  //                   },
  //                   as: 'section',
  //                   in: {
  //                     _id: '$$section._id',
  //                     title: '$$section.title',
  //                     number: '$$section.number',

  //                     subsections: {
  //                       $filter: {
  //                         input: '$subsections',
  //                         as: 'sub',
  //                         cond: {
  //                           $eq: ['$$sub.section', '$$section._id'],
  //                         },
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },

  //     // 🔹 Clean up unwanted flat arrays
  //     {
  //       $project: {
  //         sections: 0,
  //         subsections: 0,
  //       },
  //     },
  //   ]);

  //   return result[0];
  // }

  async findTaxLawChapterByChapterId(chapterId: string) {
    const id = new Types.ObjectId(chapterId);

    const result = await this.chapterModel.aggregate([
      { $match: { _id: id } },

      {
        $lookup: {
          from: 'parts',
          localField: '_id',
          foreignField: 'chapter',
          as: 'parts',
        },
      },
      {
        $lookup: {
          from: 'sections',
          localField: 'parts._id',
          foreignField: 'part',
          as: 'sections',
        },
      },
      {
        $lookup: {
          from: 'subsections',
          localField: 'sections._id',
          foreignField: 'section',
          as: 'subsections',
        },
      },

      {
        $addFields: {
          parts: {
            $map: {
              input: '$parts',
              as: 'part',
              in: {
                _id: '$$part._id',
                title: '$$part.title',
                number: '$$part.number',

                sections: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$sections',
                        as: 'sec',
                        cond: { $eq: ['$$sec.part', '$$part._id'] },
                      },
                    },
                    as: 'section',
                    in: {
                      _id: '$$section._id',
                      title: '$$section.title',
                      number: '$$section.number',
                      content: '$$section.content',

                      subsections: {
                        $map: {
                          input: {
                            $filter: {
                              input: '$subsections',
                              as: 'sub',
                              cond: {
                                $eq: ['$$sub.section', '$$section._id'],
                              },
                            },
                          },
                          as: 'sub',
                          in: {
                            _id: '$$sub._id',
                            title: '$$sub.title',
                            number: '$$sub.number',
                            content: '$$sub.content',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      {
        $project: {
          sections: 0,
          subsections: 0,
        },
      },
    ]);

    const chapter = result[0];

    return chapter;
  }

  async findTaxLaws(
    queryWithPaginationDto: QueryWithPaginationDto,
    userRole: Role,
  ): Promise<{
    taxLaws: any[];
    totalPages: number;
    totalCount: number;
  }> {
    const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

    const skip = (page - 1) * limit;

    const matchStage: any = {
      isActive: true,
    };

    if (userRole !== 'admin') {
      matchStage.status = TaxLawStatus.PUBLISHED;
    }

    // 🔍 SEARCH
    if (searchParams) {
      console.log('There is search params:', searchParams);
      const regex = new RegExp(searchParams, 'i');

      matchStage.$or = [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
        { year: { $regex: regex } }, // optional if year is string
      ];
    }

    const result = await this.taxLawModel.aggregate([
      {
        $match: matchStage,
      },

      {
        $sort: { year: -1 },
      },

      // 🔥 EVERYTHING IN ONE PIPELINE
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },

            {
              $lookup: {
                from: 'chapters',
                localField: '_id',
                foreignField: 'taxLaw',
                as: 'chapters',
              },
            },
            {
              $lookup: {
                from: 'parts',
                let: { chapterIds: '$chapters._id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $in: ['$chapter', '$$chapterIds'] },
                    },
                  },
                ],
                as: 'parts',
              },
            },
            {
              $lookup: {
                from: 'sections',
                let: { partIds: '$parts._id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $in: ['$part', '$$partIds'] },
                    },
                  },
                ],
                as: 'sections',
              },
            },
            {
              $lookup: {
                from: 'subsections',
                let: { sectionIds: '$sections._id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $in: ['$section', '$$sectionIds'] },
                    },
                  },
                ],
                as: 'subsections',
              },
            },
            {
              $lookup: {
                from: 'schedules',
                let: { taxLawId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$taxLaw', '$$taxLawId'] },
                    },
                  },
                ],
                as: 'schedules',
              },
            },

            {
              $project: {
                title: 1,
                year: 1,
                description: 1,
                // totalSections: 1,
                totalChapters: { $size: '$chapters' },
                totalParts: { $size: '$parts' },
                totalSections: { $size: '$sections' },
                totalSubsections: { $size: '$subsections' },
                totalSchedules: { $size: '$schedules' },
                chapters: {
                  _id: 1,
                  title: 1,
                  number: 1,
                },
              },
            },
          ],

          totalCount: [
            {
              $count: 'count',
            },
          ],
        },
      },

      // CLEAN RESPONSE
      {
        $addFields: {
          totalCount: {
            $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0],
          },
        },
      },
    ]);

    const taxLaws = result[0].data;
    const totalCount = result[0].totalCount;

    const totalPages = Math.ceil(totalCount / limit);

    if (page > totalPages && totalCount !== 0) {
      throw new NotFoundException({
        message: 'Page not found.',
        success: false,
        status: 404,
      });
    }

    if (taxLaws.length === 0) {
      throw new NotFoundException({
        message: 'Tax law not found.',
        success: false,
        status: 404,
      });
    }

    return {
      taxLaws,
      totalCount,
      totalPages,
    };
  }

  async fetchTaxLawsCatalog() {}
  async searchTaxLaw(queryWithPaginationDto: QueryWithPaginationDto) {
    /**
     * This handles your "Chapter 1, Section 2" logic.

If the user types "Section 2," you look for taxLaw: id and number: "2" in the Section collection.

Return the ID of that section so the frontend can "jump" to it.
     */
  }
  async getTaxLawSectionBySectionId(sectionId: string) {
    const id = new Types.ObjectId(sectionId);
    /**
     * Returns the full text of a specific section and its
     * subsections. This is called when the user finally selects a
     * section from the TOC or a search result.
     */

    const result = await this.sectionModel.aggregate([
      {
        $match: { _id: id },
      },

      {
        $lookup: {
          from: 'subsections',
          localField: '_id',
          foreignField: 'section',
          as: 'subsections',
        },
      },
      {
        $sort: { 'subsections.createdAt': -1 },
      },
    ]);

    console.log('repo result:', result);

    return result[0];
  }
  async getTaxLawsTableOfCotent(taxLawId: string) {
    const id = new Types.ObjectId(taxLawId);

    const tableOfContent = await this.taxLawModel.aggregate([
      {
        $match: { _id: id },
      },

      // CHAPTERS
      {
        $lookup: {
          from: 'chapters',
          localField: '_id',
          foreignField: 'taxLaw',
          as: 'chapters',
        },
      },

      { $unwind: '$chapters' },

      // PARTS
      {
        $lookup: {
          from: 'parts',
          localField: 'chapters._id',
          foreignField: 'chapter',
          as: 'chapters.parts',
        },
      },

      // SECTIONS (ONLY title + number)
      {
        $lookup: {
          from: 'sections',
          localField: 'chapters.parts._id',
          foreignField: 'part',
          as: 'sections',
        },
      },

      // Attach sections to parts
      {
        $addFields: {
          'chapters.parts': {
            $map: {
              input: '$chapters.parts',
              as: 'part',
              in: {
                _id: '$$part._id',
                number: '$$part.number',
                title: '$$part.title',
                sections: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$sections',
                        as: 'sec',
                        cond: { $eq: ['$$sec.part', '$$part._id'] },
                      },
                    },
                    as: 'sec',
                    in: {
                      _id: '$$sec._id',
                      number: '$$sec.number',
                      title: '$$sec.title',
                    },
                  },
                },
              },
            },
          },
        },
      },

      // GROUP BACK CHAPTERS
      {
        $group: {
          _id: '$_id',
          title: { $first: '$title' },
          chapters: {
            $push: {
              _id: '$chapters._id',
              number: '$chapters.number',
              title: '$chapters.title',
              parts: '$chapters.parts',
            },
          },
        },
      },
    ]);

    return tableOfContent[0] || null;

    /**
     * Returns the "Table of Contents."

Returns Chapters -> Parts -> Section Titles/Numbers (but not section content).

This allows the user to see the structure and click where they want to go.
     */
  }
  async findSectionById(sectionId: string) {
    const id = new Types.ObjectId(sectionId);

    const section = await this.sectionModel.findById(id);

    return section;
  }
  async findSectionBySectionNumber(lawId: string, sectionNumber: string) {}
  async findSubSection(subSectionId: string) {
    const id = new Types.ObjectId(subSectionId);

    const subSection = await this.subSectionModel.findById(id);

    return subSection;
  }
  async findSubSectionBySubSectionNumber(
    lawId: string,
    sectionNumber: string,
    subSectionNumber: string,
  ) {}

  async getSectionForDailyTips() {
    const response = await this.sectionModel.findOne().sort({ _id: 1 });

    return response;
  }

  async findAllSubSectionsInASectionUsingSectionId(sectionId: Types.ObjectId) {
    const response = await this.subSectionModel.find({ sectionId });

    return response;
  }

  async createDraft(taxLawId: string, parsed: any) {
    const id = new Types.ObjectId(taxLawId);

    return await this.taxLawModel.findByIdAndUpdate({
      _id: id,
      ...parsed,
      status: 'PROCESSING',
      totalSections: 0,
    });
  }

  async createChapter(data: any) {
    return await this.chapterModel.create(data);
  }

  async createPart(data: any) {
    return await this.partModel.create(data);
  }

  async insertSections(sections: any[]) {
    return await this.sectionModel.insertMany(sections);
  }

  async insertSubSections(subSections: any[]) {
    return await this.subSectionModel.insertMany(subSections);
  }

  async publishLaw(taxLawId: any, totalSections: number) {
    return await this.taxLawModel.updateOne(
      { _id: taxLawId },
      { totalSections, status: 'PUBLISHED' },
    );
  }

  async markAsFailed(taxLawId: any) {
    if (taxLawId) {
      await this.taxLawModel.updateOne({ _id: taxLawId }, { status: 'FAILED' });
    }
  }

  // --- CLEANUP METHODS ---

  async findProcessingLaw(targetId: string) {
    return await this.taxLawModel.findOne({
      _id: targetId,
      status: TaxLawStatus.PROCESSING,
    });
  }

  async getRelatedIds(taxLawId: any) {
    const chapters = await this.chapterModel
      .find({ taxLaw: taxLawId })
      .select('_id')
      .lean();
    const chapterIds = chapters.map((c) => c._id);

    const sections = await this.sectionModel
      .find({ taxLaw: taxLawId })
      .select('_id')
      .lean();
    const sectionIds = sections.map((s) => s._id);

    const parts = await this.partModel
      .find({ chapter: { $in: chapterIds } })
      .select('_id')
      .lean();
    const partIds = parts.map((p) => p._id);

    return { chapterIds, sectionIds, partIds };
  }

  async purgeLawData(
    taxLawId: any,
    related: { chapterIds: any[]; sectionIds: any[]; partIds: any[] },
  ) {
    await this.subSectionModel.deleteMany({
      section: { $in: related.sectionIds },
    });
    await this.sectionModel.deleteMany({ taxLaw: taxLawId });
    await this.partModel.deleteMany({ _id: { $in: related.partIds } });
    await this.chapterModel.deleteMany({ taxLaw: taxLawId });
    await this.scheduleModel.deleteMany({ taxLaw: taxLawId });
    await this.taxLawModel.deleteOne({ _id: taxLawId });
  }

  async insertSchedules(schedules: any[]) {
    return await this.scheduleModel.insertMany(schedules);
  }

  async countChapters(taxLawId: string) {
    const count = await this.chapterModel.countDocuments({
      taxLaw: new Types.ObjectId(taxLawId),
    });

    console.log('chapter count:', count);
    return count;
  }

  async countParts() {
    const count = await this.partModel.countDocuments({
      chapter: { $exists: true },
    });

    console.log('part count:', count);

    return count;
  }

  async countSchedules() {
    const count = await this.scheduleModel.countDocuments({
      taxLaw: { $exists: true },
    });

    console.log('schedule count:', count);

    return count;
  }
  async countSections() {
    const count = await this.sectionModel.countDocuments({
      part: { $exists: true },
    });

    console.log('section count:', count);

    return count;
  }
  async countSubsections() {
    const count = await this.subSectionModel.countDocuments({
      section: { $exists: true },
    });

    console.log('sub section count:', count);

    return count;
  }

  async findLawSchedulesByTaxLawId(
    taxLawId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const id = new Types.ObjectId(taxLawId);

    const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

    const skip = (page - 1) * limit;

    // Multi-word search regex
    const searchRegex = searchParams
      ? new RegExp(
          searchParams
            .trim()
            .split(/\s+/)
            .map((word) => `(?=.*${word})`)
            .join(''),
          'i',
        )
      : null;

    // Build filter
    const filter: any = {
      taxLaw: id,
    };

    if (searchRegex) {
      filter.content = { $regex: searchRegex }; // adjust field if needed
    }

    // Fetch paginated schedules
    const schedules = await this.scheduleModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional

    // Total count
    const totalSchedules = await this.scheduleModel.countDocuments(filter);

    return {
      schedules,
      totalSchedules,
      page,
      limit,
    };
  }

  // WORKING FOR TAX LAW THAT HAS DOCUMENTS UPLOAD TO IT
  // async findLawById(
  //   taxLawId: string,
  //   queryWithPaginationDto: QueryWithPaginationDto,
  // ) {
  //   const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

  //   const skip = (page - 1) * limit;
  //   const id = new Types.ObjectId(taxLawId);

  //   // ✅ Multi-word search regex
  //   const searchRegex = searchParams
  //     ? new RegExp(
  //         searchParams
  //           .trim()
  //           .split(/\s+/)
  //           .map((word) => `(?=.*${word})`)
  //           .join(''),
  //         'i',
  //       )
  //     : null;

  //   const result = await this.taxLawModel.aggregate([
  //     {
  //       $match: {
  //         _id: id,
  //         status: TaxLawStatus.PUBLISHED,
  //       },
  //     },

  //     {
  //       $facet: {
  //         // --- BRANCH 1: GLOBAL TOTALS (Unfiltered Hierarchy) ---
  //         metadata: [
  //           {
  //             $lookup: {
  //               from: 'chapters',
  //               localField: '_id',
  //               foreignField: 'taxLaw',
  //               pipeline: [
  //                 {
  //                   $lookup: {
  //                     from: 'parts',
  //                     localField: '_id',
  //                     foreignField: 'chapter',
  //                     pipeline: [
  //                       {
  //                         $lookup: {
  //                           from: 'sections',
  //                           localField: '_id',
  //                           foreignField: 'part',
  //                           pipeline: [
  //                             {
  //                               $lookup: {
  //                                 from: 'subsections',
  //                                 localField: '_id',
  //                                 foreignField: 'section',
  //                                 as: 'ss',
  //                               },
  //                             },
  //                           ],
  //                           as: 's',
  //                         },
  //                       },
  //                     ],
  //                     as: 'p',
  //                   },
  //                 },
  //               ],
  //               as: 'chapters',
  //             },
  //           },
  //           {
  //             $lookup: {
  //               from: 'schedules',
  //               localField: '_id',
  //               foreignField: 'taxLaw',
  //               as: 'sch',
  //             },
  //           },
  //           {
  //             $project: {
  //               totalChapters: { $size: '$chapters' },
  //               totalSchedules: { $size: '$sch' },
  //               totalParts: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$chapters',
  //                     as: 'c',
  //                     in: { $size: { $ifNull: ['$$c.p', []] } },
  //                   },
  //                 },
  //               },
  //               totalSections: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$chapters',
  //                     as: 'c',
  //                     in: {
  //                       $sum: {
  //                         $map: {
  //                           input: { $ifNull: ['$$c.p', []] },
  //                           as: 'p',
  //                           in: { $size: { $ifNull: ['$$p.s', []] } },
  //                         },
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               totalSubsections: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$chapters',
  //                     as: 'c',
  //                     in: {
  //                       $sum: {
  //                         $map: {
  //                           input: { $ifNull: ['$$c.p', []] },
  //                           as: 'p',
  //                           in: {
  //                             $sum: {
  //                               $map: {
  //                                 input: { $ifNull: ['$$p.s', []] },
  //                                 as: 's',
  //                                 in: { $size: { $ifNull: ['$$s.ss', []] } },
  //                               },
  //                             },
  //                           },
  //                         },
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         ],

  //         // --- BRANCH 2: FILTERED DATA & PER-CHAPTER TOTALS ---
  //         data: [
  //           {
  //             $lookup: {
  //               from: 'chapters',
  //               let: { taxLawId: '$_id' },
  //               pipeline: [
  //                 { $match: { $expr: { $eq: ['$taxLaw', '$$taxLawId'] } } },
  //                 {
  //                   $lookup: {
  //                     from: 'parts',
  //                     let: { chId: '$_id' },
  //                     pipeline: [
  //                       { $match: { $expr: { $eq: ['$chapter', '$$chId'] } } },
  //                       {
  //                         $lookup: {
  //                           from: 'sections',
  //                           let: { pId: '$_id' },
  //                           pipeline: [
  //                             {
  //                               $match: { $expr: { $eq: ['$part', '$$pId'] } },
  //                             },
  //                             {
  //                               $lookup: {
  //                                 from: 'subsections',
  //                                 let: { sId: '$_id' },
  //                                 pipeline: [
  //                                   {
  //                                     $match: {
  //                                       $expr: {
  //                                         $eq: [
  //                                           { $toObjectId: '$section' },
  //                                           '$$sId',
  //                                         ],
  //                                       },
  //                                       ...(searchRegex
  //                                         ? { content: { $regex: searchRegex } }
  //                                         : {}),
  //                                     },
  //                                   },
  //                                 ],
  //                                 as: 'subsections',
  //                               },
  //                             },
  //                             ...(searchRegex
  //                               ? [
  //                                   {
  //                                     $match: {
  //                                       'subsections.0': { $exists: true },
  //                                     },
  //                                   },
  //                                 ]
  //                               : []),
  //                           ],
  //                           as: 'sections',
  //                         },
  //                       },
  //                       ...(searchRegex
  //                         ? [{ $match: { 'sections.0': { $exists: true } } }]
  //                         : []),
  //                     ],
  //                     as: 'parts',
  //                   },
  //                 },
  //                 ...(searchRegex
  //                   ? [{ $match: { 'parts.0': { $exists: true } } }]
  //                   : []),
  //                 // Per-Chapter Totals (including fix for totalSubsections)
  //                 {
  //                   $addFields: {
  //                     totalParts: { $size: '$parts' },
  //                     totalSections: {
  //                       $sum: {
  //                         $map: {
  //                           input: '$parts',
  //                           as: 'p',
  //                           in: { $size: { $ifNull: ['$$p.sections', []] } },
  //                         },
  //                       },
  //                     },
  //                     totalSubsections: {
  //                       $sum: {
  //                         $map: {
  //                           input: '$parts',
  //                           as: 'p',
  //                           in: {
  //                             $sum: {
  //                               $map: {
  //                                 input: { $ifNull: ['$$p.sections', []] },
  //                                 as: 's',
  //                                 in: {
  //                                   $size: { $ifNull: ['$$s.subsections', []] },
  //                                 },
  //                               },
  //                             },
  //                           },
  //                         },
  //                       },
  //                     },
  //                   },
  //                 },
  //               ],
  //               as: 'chapters',
  //             },
  //           },
  //         ],
  //       },
  //     },

  //     // --- FINAL MERGE & OUTPUT ---
  //     {
  //       $project: {
  //         _id: { $arrayElemAt: ['$data._id', 0] },
  //         title: { $arrayElemAt: ['$data.title', 0] },
  //         year: { $arrayElemAt: ['$data.year', 0] },
  //         description: { $arrayElemAt: ['$data.description', 0] },
  //         // Global Totals
  //         totalChapters: { $arrayElemAt: ['$metadata.totalChapters', 0] },
  //         totalParts: { $arrayElemAt: ['$metadata.totalParts', 0] },
  //         totalSections: { $arrayElemAt: ['$metadata.totalSections', 0] },
  //         totalSubsections: { $arrayElemAt: ['$metadata.totalSubsections', 0] },
  //         totalSchedules: { $arrayElemAt: ['$metadata.totalSchedules', 0] },
  //         // Paginated Chapters
  //         chapters: {
  //           $slice: [{ $arrayElemAt: ['$data.chapters', 0] }, skip, limit],
  //         },
  //       },
  //     },
  //   ]);

  //   const taxLaw = result[0];

  //   console.log('taxLaw:', taxLaw);
  //   return taxLaw;
  // }

  async findLawById(
    taxLawId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

    const skip = (page - 1) * limit;
    const id = new Types.ObjectId(taxLawId);

    // ✅ Multi-word search regex
    const searchRegex = searchParams
      ? new RegExp(
          searchParams
            .trim()
            .split(/\s+/)
            .map((word) => `(?=.*${word})`)
            .join(''),
          'i',
        )
      : null;

    const result = await this.taxLawModel.aggregate([
      {
        $match: {
          _id: id,
          status: TaxLawStatus.PUBLISHED,
        },
      },

      {
        $facet: {
          // ===============================
          // ✅ METADATA (GLOBAL TOTALS)
          // ===============================
          metadata: [
            {
              $lookup: {
                from: 'chapters',
                localField: '_id',
                foreignField: 'taxLaw',
                pipeline: [
                  {
                    $lookup: {
                      from: 'parts',
                      localField: '_id',
                      foreignField: 'chapter',
                      pipeline: [
                        {
                          $lookup: {
                            from: 'sections',
                            localField: '_id',
                            foreignField: 'part',
                            pipeline: [
                              {
                                $lookup: {
                                  from: 'subsections',
                                  localField: '_id',
                                  foreignField: 'section',
                                  as: 'ss',
                                },
                              },
                            ],
                            as: 's',
                          },
                        },
                      ],
                      as: 'p',
                    },
                  },
                ],
                as: 'chapters',
              },
            },
            {
              $lookup: {
                from: 'schedules',
                localField: '_id',
                foreignField: 'taxLaw',
                as: 'sch',
              },
            },
            {
              $project: {
                totalChapters: { $size: '$chapters' },
                totalSchedules: { $size: '$sch' },
                totalParts: {
                  $sum: {
                    $map: {
                      input: '$chapters',
                      as: 'c',
                      in: { $size: { $ifNull: ['$$c.p', []] } },
                    },
                  },
                },
                totalSections: {
                  $sum: {
                    $map: {
                      input: '$chapters',
                      as: 'c',
                      in: {
                        $sum: {
                          $map: {
                            input: { $ifNull: ['$$c.p', []] },
                            as: 'p',
                            in: { $size: { $ifNull: ['$$p.s', []] } },
                          },
                        },
                      },
                    },
                  },
                },
                totalSubsections: {
                  $sum: {
                    $map: {
                      input: '$chapters',
                      as: 'c',
                      in: {
                        $sum: {
                          $map: {
                            input: { $ifNull: ['$$c.p', []] },
                            as: 'p',
                            in: {
                              $sum: {
                                $map: {
                                  input: { $ifNull: ['$$p.s', []] },
                                  as: 's',
                                  in: {
                                    $size: { $ifNull: ['$$s.ss', []] },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],

          // ===============================
          // ✅ DATA (MAIN DATA + FIXED ROOT FIELDS)
          // ===============================
          data: [
            // ✅ FIX 1: Preserve root fields
            {
              $project: {
                _id: 1,
                title: 1,
                year: 1,
                description: 1,
              },
            },

            {
              $lookup: {
                from: 'chapters',
                let: { taxLawId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$taxLaw', '$$taxLawId'] } } },
                  {
                    $lookup: {
                      from: 'parts',
                      let: { chId: '$_id' },
                      pipeline: [
                        { $match: { $expr: { $eq: ['$chapter', '$$chId'] } } },
                        {
                          $lookup: {
                            from: 'sections',
                            let: { pId: '$_id' },
                            pipeline: [
                              {
                                $match: { $expr: { $eq: ['$part', '$$pId'] } },
                              },
                              {
                                $lookup: {
                                  from: 'subsections',
                                  let: { sId: '$_id' },
                                  pipeline: [
                                    {
                                      $match: {
                                        $expr: {
                                          $eq: [
                                            { $toObjectId: '$section' },
                                            '$$sId',
                                          ],
                                        },
                                        ...(searchRegex
                                          ? {
                                              content: {
                                                $regex: searchRegex,
                                              },
                                            }
                                          : {}),
                                      },
                                    },
                                  ],
                                  as: 'subsections',
                                },
                              },
                              ...(searchRegex
                                ? [
                                    {
                                      $match: {
                                        'subsections.0': { $exists: true },
                                      },
                                    },
                                  ]
                                : []),
                            ],
                            as: 'sections',
                          },
                        },
                        ...(searchRegex
                          ? [
                              {
                                $match: {
                                  'sections.0': { $exists: true },
                                },
                              },
                            ]
                          : []),
                      ],
                      as: 'parts',
                    },
                  },
                  ...(searchRegex
                    ? [{ $match: { 'parts.0': { $exists: true } } }]
                    : []),

                  // ✅ Per-Chapter Totals
                  {
                    $addFields: {
                      totalParts: { $size: '$parts' },
                      totalSections: {
                        $sum: {
                          $map: {
                            input: '$parts',
                            as: 'p',
                            in: {
                              $size: {
                                $ifNull: ['$$p.sections', []],
                              },
                            },
                          },
                        },
                      },
                      totalSubsections: {
                        $sum: {
                          $map: {
                            input: '$parts',
                            as: 'p',
                            in: {
                              $sum: {
                                $map: {
                                  input: {
                                    $ifNull: ['$$p.sections', []],
                                  },
                                  as: 's',
                                  in: {
                                    $size: {
                                      $ifNull: ['$$s.subsections', []],
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
                as: 'chapters',
              },
            },
          ],
        },
      },

      // ===============================
      // ✅ FINAL MERGE
      // ===============================
      {
        $project: {
          // ✅ FIX 2: Ensure ID always exists
          _id: {
            $ifNull: [{ $arrayElemAt: ['$data._id', 0] }, id],
          },
          title: { $arrayElemAt: ['$data.title', 0] },
          year: { $arrayElemAt: ['$data.year', 0] },
          description: {
            $arrayElemAt: ['$data.description', 0],
          },

          // Global totals
          totalChapters: {
            $arrayElemAt: ['$metadata.totalChapters', 0],
          },
          totalParts: {
            $arrayElemAt: ['$metadata.totalParts', 0],
          },
          totalSections: {
            $arrayElemAt: ['$metadata.totalSections', 0],
          },
          totalSubsections: {
            $arrayElemAt: ['$metadata.totalSubsections', 0],
          },
          totalSchedules: {
            $arrayElemAt: ['$metadata.totalSchedules', 0],
          },

          // ✅ FIX 3: Chapters fallback to []
          chapters: {
            $slice: [
              {
                $ifNull: [{ $arrayElemAt: ['$data.chapters', 0] }, []],
              },
              skip,
              limit,
            ],
          },
        },
      },
    ]);

    const taxLaw = result[0];

    console.log('taxLaw:', taxLaw);

    return taxLaw;
  }

  async findLawByTaxLawId(taxLawId: string) {
    const id = new Types.ObjectId(taxLawId);
    const response = await this.taxLawModel.findById(id);

    return response;
  }
  async getSectionBySectionId(
    sectionId: string,
  ): Promise<SectionDocument | null> {
    const id = new Types.ObjectId(sectionId);
    const section = await this.sectionModel.findById(id);
    return section;
  }
  async updateScheduleByScheduleId(
    scheduleId: string,
    data: Partial<ScheduleDocument>,
  ): Promise<ScheduleDocument | null> {
    const id = new Types.ObjectId(scheduleId);

    const response = await this.scheduleModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
    });

    return response;
  }
  async updateSectionBySectionId(
    sectionId: string,
    data: Partial<SectionDocument>,
  ): Promise<SectionDocument | null> {
    const id = new Types.ObjectId(sectionId);
    const response = await this.sectionModel.findByIdAndUpdate(
      id,
      data,

      {
        returnDocument: 'after',
      },
    );

    return response;
  }
  async getPartByPartId(partId: string): Promise<PartDocument | null> {
    const id = new Types.ObjectId(partId);
    const part = await this.partModel.findById(id);
    return part;
  }
  async updatePartByPartId(
    partId: string,
    data: Partial<PartDocument>,
  ): Promise<PartDocument | null> {
    const id = new Types.ObjectId(partId);

    console.log('data:', data);
    const response = await this.partModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
    });
    console.log('response:', response);

    return response;
  }
  async getChapterByChapterId(
    chapterId: string,
  ): Promise<ChapterDocument | null> {
    const id = new Types.ObjectId(chapterId);
    const chapter = await this.chapterModel.findById(id);
    return chapter;
  }
  async updateChapterByChapterId(
    chapterId: string,
    data: Partial<SubSectionDocument>,
  ): Promise<ChapterDocument | null> {
    const id = new Types.ObjectId(chapterId);
    const response = await this.chapterModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
    });

    return response;
  }
  async getChapterByTaxLawIdAndNumber(
    taxLawId: string,
    number: string,
  ): Promise<ChapterDocument | null> {
    const taxLaw = new Types.ObjectId(taxLawId);
    const chapter = await this.chapterModel.findOne({
      taxLaw,
      number,
    });
    return chapter;
  }
  async getScheduleByTaxLawIdAndNumber(
    taxLawId: string,
    number: string,
  ): Promise<ScheduleDocument | null> {
    const taxLaw = new Types.ObjectId(taxLawId);
    const schedule = await this.scheduleModel.findOne({
      taxLaw,
      number,
    });
    return schedule;
  }
  async getPartByChapterIdAndNumber(
    chapterId: string,
    number: string,
  ): Promise<PartDocument | null> {
    const chapter = new Types.ObjectId(chapterId);
    const section = await this.partModel.findOne({
      chapter,
      number,
    });
    return section;
  }
  async getSectionByPartIdAndNumber(
    partId: string,
    number: string,
  ): Promise<SectionDocument | null> {
    const part = new Types.ObjectId(partId);
    const section = await this.sectionModel.findOne({
      part,
      number,
    });
    return section;
  }
  async getSubSectionBySectionIdAndNumber(
    sectionId: string,
    number: string,
  ): Promise<SubSectionDocument | null> {
    const section = new Types.ObjectId(sectionId);
    const subSection = await this.subSectionModel.findOne({
      section,
      number,
    });
    return subSection;
  }
  async getSubSectionBySubSectionId(
    subSectionId: string,
  ): Promise<SubSectionDocument | null> {
    const id = new Types.ObjectId(subSectionId);
    const subSection = await this.subSectionModel.findById(id);

    console.log('subSection:', subSection);

    return subSection;
  }
  async createPartByChapterId(
    chapterId: string,
    createPartDto: CreatePartDto,
  ): Promise<PartDocument | null> {
    const chapter = new Types.ObjectId(chapterId);

    const data = {
      chapter,
      ...createPartDto,
    };
    const response = await new this.partModel(data).save();

    return response;
  }
  async createSectionUsingPartId(
    partId: string,
    createSectionDto: CreateSectionDto,
  ): Promise<SectionDocument | null> {
    const part = new Types.ObjectId(partId);

    const data = {
      part,
      ...createSectionDto,
    };
    const response = await new this.sectionModel(data).save();

    return response;
  }
  async createChapterUsingTaxLawId(
    taxLawId: string,
    createChapterDto: CreateChapterDto,
  ): Promise<ChapterDocument | null> {
    const taxLaw = new Types.ObjectId(taxLawId);

    const data = {
      taxLaw,
      ...createChapterDto,
    };
    const response = await new this.chapterModel(data).save();

    return response;
  }
  async createScheduleUsingTaxLawId(
    taxLawId: string,
    createScheduleDto: CreateScheduleDto,
  ): Promise<ScheduleDocument | null> {
    const taxLaw = new Types.ObjectId(taxLawId);

    const data = {
      taxLaw,
      ...createScheduleDto,
    };
    const response = await new this.scheduleModel(data).save();

    return response;
  }
  async createSubsectionUsingSectionId(
    sectionId: string,
    createSubSectionDto: CreateSubSectionDto,
  ): Promise<SubSectionDocument | null> {
    const section = new Types.ObjectId(sectionId);

    const data = {
      section,
      ...createSubSectionDto,
    };
    const response = await new this.subSectionModel(data).save();

    return response;
  }
  async updateSubSectionBySubSectionId(
    subSectionId: string,
    data: Partial<SubSectionDocument>,
  ): Promise<SubSectionDocument | null> {
    const id = new Types.ObjectId(subSectionId);
    const response = await this.subSectionModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
    });

    return response;
  }

  async getSubSectionWithSection(subSectionId: string) {
    return this.subSectionModel
      .findById(new Types.ObjectId(subSectionId))
      .populate('section'); // gives section info
  }

  async getNextSection() {
    return this.sectionModel.findOne().sort({ order: 1 });
  }

  // pick valid subsection (NOT recently sent)
  async getValidSubSection(sectionId: string) {
    const subSections = await this.subSectionModel.find({
      section: new Types.ObjectId(sectionId),
    });

    const valid: SubSectionDocument[] = [];

    for (const sub of subSections) {
      const recentlySent = await this.dailyTipsRepository.wasRecentlySent(
        sub._id.toString(),
      );

      if (!recentlySent) {
        valid.push(sub);
      }
    }

    // fallback if all were recently sent
    if (valid.length === 0) {
      return subSections[Math.floor(Math.random() * subSections.length)];
    }

    // random valid pick
    return valid[Math.floor(Math.random() * valid.length)];
  }

  async getRandomSection() {
    const sections = await this.sectionModel.find();
    if (!sections.length) return null;

    const response = sections[Math.floor(Math.random() * sections.length)];
    console.log('getRandomSection response:', response);

    return response;
  }

  async getRandomValidSubSection(sectionId: string) {
    const subSections = await this.subSectionModel.find({
      section: new Types.ObjectId(sectionId),
    });

    if (!subSections.length) return null;

    // filter out recently sent
    const valid: any[] = [];

    for (const sub of subSections) {
      const recentlySent = await this.dailyTipsRepository.wasRecentlySent(
        sub._id.toString(),
      );

      if (!recentlySent) {
        valid.push(sub);
      }
    }

    // fallback if everything exhausted
    if (!valid.length) {
      return null;
    }

    const response = valid[Math.floor(Math.random() * valid.length)];
    console.log('getRandomValidSubscription:', response);

    return response;
  }

  async countSubSections(sectionId: string) {
    return this.subSectionModel.countDocuments({
      section: new Types.ObjectId(sectionId),
    });
  }

  async getAllSections() {
    const response = await this.sectionModel.find().sort({ order: 1 });
    console.log('get All sections:', response);

    return response;
  }

  async getLastChapterOrder(taxLawId: string) {
    return this.chapterModel
      .findOne({ taxLaw: new Types.ObjectId(taxLawId) })
      .sort({ order: -1 });
  }

  async getLastPartOrder(chapterId: string) {
    return this.partModel
      .findOne({ chapter: new Types.ObjectId(chapterId) })
      .sort({ order: -1 });
  }

  async getLastSectionOrder(partId: string) {
    return this.sectionModel
      .findOne({ part: new Types.ObjectId(partId) })
      .sort({ order: -1 });
  }

  async resolveTaxLawIdFromEntity(
    level: TaxLawLevels,
    entityId: string,
  ): Promise<Types.ObjectId> {
    const id = new Types.ObjectId(entityId);

    switch (level) {
      case 'TAXLAW':
        return id;

      case 'CHAPTER': {
        const chapter = await this.chapterModel
          .findById(id)
          .select('taxLaw')
          .lean();

        if (!chapter) throw new NotFoundException('Chapter not found');
        return chapter.taxLaw;
      }

      case 'PART': {
        const part = await this.partModel.findById(id).select('chapter').lean();

        if (!part) throw new NotFoundException('Part not found');

        const chapter = await this.chapterModel
          .findById(part.chapter)
          .select('taxLaw')
          .lean();

        if (!chapter) throw new NotFoundException('Chapter not found');

        console.log('chapter.taxLaw:', chapter.taxLaw);

        return chapter.taxLaw;
      }

      case 'SECTION': {
        const section = await this.sectionModel
          .findById(id)
          .select('part')
          .lean();

        if (!section) throw new NotFoundException('Section not found');

        console.log('section:', section);
        const part = await this.partModel
          .findById(section.part)
          .select('chapter')
          .lean();

        if (!part) throw new NotFoundException('Part not found');

        console.log('part:', part);
        const chapter = await this.chapterModel
          .findById(part.chapter)
          .select('taxLaw')
          .lean();

        if (!chapter) throw new NotFoundException('Chapter not found');

        console.log('chapter.taxLaw:', chapter.taxLaw);
        return chapter.taxLaw;
      }

      case 'SUBSECTION': {
        const sub = await this.subSectionModel
          .findById(id)
          .select('section')
          .lean();

        if (!sub) throw new NotFoundException('SubSection not found');

        const section = await this.sectionModel
          .findById(sub.section)
          .select('part')
          .lean();

        if (!section) throw new NotFoundException('Section not found');

        const part = await this.partModel
          .findById(section.part)
          .select('chapter')
          .lean();

        if (!part) throw new NotFoundException('Part not found');

        const chapter = await this.chapterModel
          .findById(part.chapter)
          .select('taxLaw')
          .lean();

        if (!chapter) throw new NotFoundException('Chapter not found');

        return chapter.taxLaw;
      }
    }
  }

  async getTaxLawStats() {
    const totalTaxLaws = await this.taxLawModel.countDocuments();
    return { totalTaxLaws };
  }

  async getStructureStats() {
    const [chapters, parts, sections, subsections, schedules] =
      await Promise.all([
        this.chapterModel.countDocuments(),
        this.partModel.countDocuments(),
        this.sectionModel.countDocuments(),
        this.subSectionModel.countDocuments(),
        this.scheduleModel.countDocuments(),
      ]);

    return {
      totalChapters: chapters,
      totalParts: parts,
      totalSections: sections,
      totalSubsections: subsections,
      totalSchedules: schedules,
    };
  }

  async getUploadStats() {
    const result = await this.taxLawModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return result;
  }

  async getRecentActivity() {
    return this.taxLawModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt status');
  }

  async getUploadTrends() {
    return this.taxLawModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
    ]);
  }
}
