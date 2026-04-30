import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
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
  ) {}

  // async createFullTaxLawDocument(parsed: any) {
  //   const session = await this.connection.startSession();
  //   session.startTransaction();

  //   try {
  //     // 1️⃣ Create the Parent TaxLaw
  //     const [taxLaw] = await this.taxLawModel.create(
  //       [
  //         {
  //           title: parsed.title,
  //           year: parsed.year,
  //           description: parsed.description,
  //         },
  //       ],
  //       { session },
  //     );

  //     const chapterIds: any[] = [];
  //     let totalSectionsCount = 0;

  //     console.log('parsed.chapters[0]:', parsed.chapters[0]);
  //     console.log('parsed.chapters[0].parts[0]:', parsed.chapters[0].parts[0]);

  //     for (const ch of parsed.chapters || []) {
  //       // 2️⃣ Create Chapter
  //       const [chapter] = await this.chapterModel.create(
  //         [
  //           {
  //             taxLaw: taxLaw._id,
  //             title: ch.title,
  //             number: ch.number,
  //           },
  //         ],
  //         { session },
  //       );
  //       chapterIds.push(chapter._id);

  //       const partIds: any[] = [];

  //       for (const pt of ch.parts || []) {
  //         // 3️⃣ Create Part
  //         const [part] = await this.partModel.create(
  //           [
  //             {
  //               chapter: chapter._id,
  //               title: pt.title,
  //               number: pt.number,
  //             },
  //           ],
  //           { session },
  //         );
  //         partIds.push(part._id);

  //         // --- OPTIMIZATION START ---
  //         // Instead of await inside the loop, we prepare all data first
  //         const sectionData: any[] = [];
  //         const allSubsections: any[] = [];

  //         for (const sec of pt.sections || []) {
  //           totalSectionsCount++;

  //           // Prepare subsections for this specific section
  //           const subs = (sec.subsections || []).map((s) => ({
  //             number: s.number,
  //             content: s.content,
  //             // Temporary field to link them back after insertion
  //             tempSectionId: sec.number,
  //           }));
  //           allSubsections.push(...subs);

  //           sectionData.push({
  //             part: part._id,
  //             title: sec.title,
  //             number: sec.number,
  //             content: sec.content,
  //             subsections: [], // Will fill this in a moment
  //           });
  //         }

  //         // 4️⃣ Bulk Insert Subsections for this Part
  //         const createdSubs = await this.subSectionModel.insertMany(
  //           allSubsections,
  //           { session },
  //         );

  //         // 5️⃣ Bulk Insert Sections for this Part
  //         // Map the created subsections back to their sections
  //         const sectionsToInsert = sectionData.map((secDoc) => {
  //           const relatedSubIds = createdSubs
  //             .filter((s) => (s as any).tempSectionId === secDoc.number)
  //             .map((s) => s._id);
  //           return { ...secDoc, subsections: relatedSubIds };
  //         });

  //         const createdSections = await this.sectionModel.insertMany(
  //           sectionsToInsert,
  //           { session },
  //         );
  //         const sectionIds = createdSections.map((s) => s._id);

  //         // 6️⃣ Link Sections to Part
  //         await this.partModel.updateOne(
  //           { _id: part._id },
  //           { sections: sectionIds },
  //           { session },
  //         );
  //       }

  //       // 7️⃣ Link Parts to Chapter
  //       await this.chapterModel.updateOne(
  //         { _id: chapter._id },
  //         { parts: partIds },
  //         { session },
  //       );
  //     }

  //     // 8️⃣ Bulk Insert Schedules
  //     if (parsed.schedules?.length) {
  //       const scheduleDocs = parsed.schedules.map((sch) => ({
  //         taxLaw: taxLaw._id,
  //         title: sch.title,
  //         number: sch.number,
  //         content: sch.content,
  //       }));
  //       const createdSchedules = await this.scheduleModel.insertMany(
  //         scheduleDocs,
  //         { session },
  //       );

  //       console.log('createdSchedules:', createdSchedules);

  //       const updatedTaxLaw = await this.taxLawModel.updateOne(
  //         { _id: taxLaw._id },
  //         {
  //           chapters: chapterIds,
  //           schedules: createdSchedules.map((s) => s._id),
  //           totalSections: totalSectionsCount,
  //         },
  //         { session },
  //       );
  //       console.log('updatedTaxLaw:', updatedTaxLaw);
  //     }

  //     await session.commitTransaction();
  //     return taxLaw;
  //   } catch (error) {
  //     if (session.inTransaction()) await session.abortTransaction();
  //     console.error('DETAILED REPO ERROR:', error);
  //     throw error;
  //   } finally {
  //     await session.endSession();
  //   }
  // }

  // async createFullTaxLawDocument(parsed: any) {
  //   const session = await this.connection.startSession();
  //   session.startTransaction();

  //   try {
  //     const [taxLaw] = await this.taxLawModel.create(
  //       [
  //         {
  //           title: parsed.title,
  //           year: parsed.year,
  //           description: parsed.description,
  //         },
  //       ],
  //       { session },
  //     );

  //     let totalSectionsCount = 0;
  //     const chapterIds: any[] = [];

  //     for (const ch of parsed.chapters || []) {
  //       const [chapter] = await this.chapterModel.create(
  //         [{ taxLaw: taxLaw._id, title: ch.title, number: ch.number }],
  //         { session },
  //       );
  //       chapterIds.push(chapter._id);

  //       const partIds: any[] = [];

  //       for (const pt of ch.parts || []) {
  //         const [part] = await this.partModel.create(
  //           [{ chapter: chapter._id, title: pt.title, number: pt.number }],
  //           { session },
  //         );
  //         partIds.push(part._id);

  //         // 1. Prepare Sections (without subsections yet)
  //         const sectionData: any[] = pt.sections.map((sec) => ({
  //           part: part._id,
  //           title: sec.title,
  //           number: sec.number,
  //           content: sec.content,
  //           subsections: [],
  //         }));

  //         // 2. Bulk Insert Sections first to get their IDs
  //         const createdSections = await this.sectionModel.insertMany(
  //           sectionData,
  //           { session },
  //         );
  //         totalSectionsCount += createdSections.length;

  //         const allSubsections: any[] = [];

  //         // 3. Prepare Subsections using the real Section IDs we just created
  //         pt.sections.forEach((sec, index) => {
  //           const sectionId = createdSections[index]._id;

  //           if (sec.subsections && sec.subsections.length > 0) {
  //             const subs = sec.subsections.map((s) => ({
  //               section: sectionId, // <--- Now we have the required ID!
  //               number: s.number,
  //               content: s.content,
  //             }));
  //             allSubsections.push(...subs);
  //           }
  //         });

  //         // 4. Bulk Insert Subsections
  //         if (allSubsections.length > 0) {
  //           const createdSubs = await this.subSectionModel.insertMany(
  //             allSubsections,
  //             { session },
  //           );

  //           // 5. Link Subsections back to Sections (Bulk Update)
  //           // We use bulkWrite for maximum performance to avoid timeout
  //           const bulkUpdateOps = createdSections.map((secDoc) => {
  //             const relatedSubIds = createdSubs
  //               .filter(
  //                 (sub) => sub.section.toString() === secDoc._id.toString(),
  //               )
  //               .map((sub) => sub._id);

  //             return {
  //               updateOne: {
  //                 filter: { _id: secDoc._id },
  //                 update: { $set: { subsections: relatedSubIds } },
  //               },
  //             };
  //           });

  //           await this.sectionModel.bulkWrite(bulkUpdateOps, { session });
  //         }

  //         // 6. Link Sections to Part
  //         await this.partModel.updateOne(
  //           { _id: part._id },
  //           { sections: createdSections.map((s) => s._id) },
  //           { session },
  //         );
  //       }

  //       await this.chapterModel.updateOne(
  //         { _id: chapter._id },
  //         { parts: partIds },
  //         { session },
  //       );
  //     }

  //     // 7. Handle Schedules
  //     const scheduleIds: any[] = [];
  //     if (parsed.schedules?.length) {
  //       const createdSchedules = await this.scheduleModel.insertMany(
  //         parsed.schedules.map((sch) => ({ ...sch, taxLaw: taxLaw._id })),
  //         { session },
  //       );
  //       scheduleIds.push(...createdSchedules.map((s) => s._id));
  //     }

  //     // 8. Final TaxLaw Update
  //     await this.taxLawModel.updateOne(
  //       { _id: taxLaw._id },
  //       {
  //         chapters: chapterIds,
  //         schedules: scheduleIds,
  //         totalSections: totalSectionsCount,
  //       },
  //       { session },
  //     );

  //     await session.commitTransaction();
  //     return taxLaw;
  //   } catch (error) {
  //     if (session.inTransaction()) await session.abortTransaction();
  //     console.error('DETAILED REPO ERROR:', error);
  //     throw error;
  //   } finally {
  //     await session.endSession();
  //   }
  // }

  // async createFullTaxLawDocument(parsed: any) {
  //   const session = await this.connection.startSession();
  //   session.startTransaction();

  //   try {
  //     const [taxLaw] = await this.taxLawModel.create(
  //       [
  //         {
  //           title: parsed.title,
  //           year: parsed.year,
  //           description: parsed.description,
  //         },
  //       ],
  //       { session },
  //     );

  //     let totalSectionsCount = 0;
  //     const chapterIds: any[] = [];

  //     console.log('parsed.chapters[0]:', parsed.chapters[0]);
  //     console.log('parsed.chapters[0].parts[0]:', parsed.chapters[0].parts[0]);
  //     for (const ch of parsed.chapters || []) {
  //       const [chapter] = await this.chapterModel.create(
  //         [{ taxLaw: taxLaw._id, title: ch.title, number: ch.number }],
  //         { session },
  //       );
  //       chapterIds.push(chapter._id);

  //       const partIds: any[] = [];

  //       for (const pt of ch.parts || []) {
  //         const [part] = await this.partModel.create(
  //           [{ chapter: chapter._id, title: pt.title, number: pt.number }],
  //           { session },
  //         );
  //         partIds.push(part._id);

  //         // 1. Prepare Sections (Lean objects)
  //         const sectionData = pt.sections.map((sec) => ({
  //           part: part._id,
  //           title: sec.title,
  //           number: sec.number,
  //           content: sec.content,
  //           subsections: [],
  //         }));

  //         // 2. Insert Sections - Use { lean: true } or convert result to save RAM
  //         const createdSections = await this.sectionModel.insertMany(
  //           sectionData,
  //           { session, lean: true },
  //         );
  //         totalSectionsCount += createdSections.length;

  //         // 3. Prepare Subsections
  //         const allSubsections: any[] = [];
  //         pt.sections.forEach((sec, index) => {
  //           const sectionId = createdSections[index]._id;
  //           if (sec.subsections?.length > 0) {
  //             sec.subsections.forEach((s) => {
  //               allSubsections.push({
  //                 section: sectionId,
  //                 number: s.number,
  //                 content: s.content,
  //               });
  //             });
  //           }
  //         });

  //         if (allSubsections.length > 0) {
  //           // 4. Insert Subsections
  //           const createdSubs = await this.subSectionModel.insertMany(
  //             allSubsections,
  //             { session, lean: true },
  //           );

  //           // 5. MEMORY EFFICIENT LINKING: Use a Map for O(1) lookup instead of .filter()
  //           // This prevents the CPU/Memory spike during heavy array iterations
  //           const subMap = new Map();
  //           createdSubs.forEach((sub) => {
  //             const sId = sub.section.toString();
  //             if (!subMap.has(sId)) subMap.set(sId, []);
  //             subMap.get(sId).push(sub._id);
  //           });

  //           const bulkUpdateOps = createdSections.map((secDoc) => ({
  //             updateOne: {
  //               filter: { _id: secDoc._id },
  //               update: {
  //                 $set: {
  //                   subsections: subMap.get(secDoc._id.toString()) || [],
  //                 },
  //               },
  //             },
  //           }));

  //           await this.sectionModel.bulkWrite(bulkUpdateOps, { session });
  //         }

  //         // 6. Link Sections to Part
  //         const partRes = await this.partModel.updateOne(
  //           { _id: part._id },
  //           { sections: createdSections.map((s) => s._id) },
  //           { session },
  //         );

  //         console.log('partRes:', partRes);
  //       }

  //       const chapterRes = await this.chapterModel.updateOne(
  //         { _id: chapter._id },
  //         { parts: partIds },
  //         { session },
  //       );
  //       console.log('chapterRes:', chapterRes);
  //     }

  //     // 7. Schedules
  //     const scheduleIds: any[] = [];
  //     if (parsed.schedules?.length) {
  //       const createdSchedules = await this.scheduleModel.insertMany(
  //         parsed.schedules.map((sch) => ({ ...sch, taxLaw: taxLaw._id })),
  //         { session, lean: true },
  //       );
  //       scheduleIds.push(...createdSchedules.map((s) => s._id));
  //     }

  //     // 8. Final TaxLaw Update
  //     const taxRes = await this.taxLawModel.updateOne(
  //       { _id: taxLaw._id },
  //       {
  //         chapters: chapterIds,
  //         schedules: scheduleIds,
  //         totalSections: totalSectionsCount,
  //       },
  //       { session },
  //     );
  //     console.log('taxRes:', taxRes);

  //     await session.commitTransaction();
  //     return taxLaw;
  //   } catch (error) {
  //     if (session.inTransaction()) await session.abortTransaction();
  //     console.error('DETAILED REPO ERROR:', error);
  //     throw error;
  //   } finally {
  //     await session.endSession();
  //   }
  // }

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
  // async findLawById(
  //   taxLawId: string,
  //   queryWithPaginationDto: QueryWithPaginationDto,
  // ) {
  //   const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

  //   const skip = (page - 1) * limit;
  //   const id = new Types.ObjectId(taxLawId);

  //   const result = await this.taxLawModel.aggregate([
  //     {
  //       $match: {
  //         _id: id,
  //         status: TaxLawStatus.PUBLISHED,
  //       },
  //     },

  //     // ------------------- LOOKUPS -------------------
  //     {
  //       $lookup: {
  //         from: 'chapters',
  //         localField: '_id',
  //         foreignField: 'taxLaw',
  //         as: 'chapters',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'parts',
  //         localField: 'chapters._id',
  //         foreignField: 'chapter',
  //         as: 'parts',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'sections',
  //         localField: 'parts._id',
  //         foreignField: 'part',
  //         as: 'sections',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'subsections',
  //         localField: 'sections._id',
  //         foreignField: 'section',
  //         as: 'subsections',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'schedules',
  //         localField: 'subsections._id',
  //         foreignField: 'subsection',
  //         as: 'schedules',
  //       },
  //     },

  //     // ------------------- SEARCH FILTER -------------------
  //     ...(searchParams
  //       ? [
  //           {
  //             $addFields: {
  //               chapters: {
  //                 $map: {
  //                   input: '$chapters',
  //                   as: 'chapter',
  //                   in: {
  //                     _id: '$$chapter._id',
  //                     number: '$$chapter.number',
  //                     title: '$$chapter.title',

  //                     parts: {
  //                       $map: {
  //                         input: {
  //                           $filter: {
  //                             input: '$parts',
  //                             as: 'part',
  //                             cond: {
  //                               $eq: ['$$part.chapter', '$$chapter._id'],
  //                             },
  //                           },
  //                         },
  //                         as: 'part',
  //                         in: {
  //                           _id: '$$part._id',
  //                           number: '$$part.number',
  //                           title: '$$part.title',

  //                           sections: {
  //                             $map: {
  //                               input: {
  //                                 $filter: {
  //                                   input: '$sections',
  //                                   as: 'section',
  //                                   cond: {
  //                                     $eq: ['$$section.part', '$$part._id'],
  //                                   },
  //                                 },
  //                               },
  //                               as: 'section',
  //                               in: {
  //                                 _id: '$$section._id',
  //                                 number: '$$section.number',
  //                                 title: '$$section.title',

  //                                 subsections: {
  //                                   $filter: {
  //                                     input: '$subsections',
  //                                     as: 'sub',
  //                                     cond: {
  //                                       $and: [
  //                                         {
  //                                           $eq: [
  //                                             '$$sub.section',
  //                                             '$$section._id',
  //                                           ],
  //                                         },
  //                                         {
  //                                           $regexMatch: {
  //                                             input: '$$sub.content',
  //                                             regex: searchParams,
  //                                             options: 'i',
  //                                           },
  //                                         },
  //                                       ],
  //                                     },
  //                                   },
  //                                 },
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

  //           // 🔥 REMOVE EMPTY BRANCHES
  //           {
  //             $addFields: {
  //               chapters: {
  //                 $filter: {
  //                   input: '$chapters',
  //                   as: 'chapter',
  //                   cond: {
  //                     $or: [
  //                       {
  //                         $regexMatch: {
  //                           input: '$$chapter.title',
  //                           regex: searchParams,
  //                           options: 'i',
  //                         },
  //                       },
  //                       {
  //                         $gt: [
  //                           {
  //                             $size: '$$chapter.parts',
  //                           },
  //                           0,
  //                         ],
  //                       },
  //                     ],
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         ]
  //       : []),

  //     // ------------------- PAGINATION -------------------
  //     {
  //       $addFields: {
  //         totalChapters: { $size: '$chapters' },
  //         chapters: {
  //           $slice: ['$chapters', skip, limit],
  //         },
  //       },
  //     },

  //     // ------------------- FINAL OUTPUT -------------------
  //     {
  //       $project: {
  //         title: 1,
  //         year: 1,
  //         description: 1,
  //         totalChapters: 1,
  //         chapters: 1,
  //       },
  //     },
  //   ]);

  //   const taxLaw = result[0];

  //   if (!taxLaw) {
  //     throw new NotFoundException({
  //       message: 'Tax law not found.',
  //       success: false,
  //       status: 404,
  //     });
  //   }

  //   return taxLaw;
  // }

  // async findLawById(
  //   taxLawId: string,
  //   queryWithPaginationDto: QueryWithPaginationDto,
  // ) {
  //   const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

  //   const skip = (page - 1) * limit;
  //   const id = new Types.ObjectId(taxLawId);

  //   const result = await this.taxLawModel.aggregate([
  //     {
  //       $match: {
  //         _id: id,
  //         status: TaxLawStatus.PUBLISHED,
  //       },
  //     },

  //     // ------------------- LOOKUPS -------------------
  //     {
  //       $lookup: {
  //         from: 'chapters',
  //         localField: '_id',
  //         foreignField: 'taxLaw',
  //         as: 'chapters',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'parts',
  //         localField: 'chapters._id',
  //         foreignField: 'chapter',
  //         as: 'parts',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'sections',
  //         localField: 'parts._id',
  //         foreignField: 'part',
  //         as: 'sections',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'subsections',
  //         localField: 'sections._id',
  //         foreignField: 'section',
  //         as: 'subsections',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'schedules',
  //         localField: 'subsections._id',
  //         foreignField: 'subsection',
  //         as: 'schedules',
  //       },
  //     },

  //     // ------------------- FILTER TREE -------------------
  //     ...(searchParams
  //       ? [
  //           {
  //             $addFields: {
  //               chapters: {
  //                 $map: {
  //                   input: '$chapters',
  //                   as: 'chapter',
  //                   in: {
  //                     _id: '$$chapter._id',
  //                     number: '$$chapter.number',
  //                     title: '$$chapter.title',

  //                     parts: {
  //                       $map: {
  //                         input: {
  //                           $filter: {
  //                             input: '$parts',
  //                             as: 'part',
  //                             cond: {
  //                               $eq: ['$$part.chapter', '$$chapter._id'],
  //                             },
  //                           },
  //                         },
  //                         as: 'part',
  //                         in: {
  //                           _id: '$$part._id',
  //                           number: '$$part.number',
  //                           title: '$$part.title',

  //                           sections: {
  //                             $map: {
  //                               input: {
  //                                 $filter: {
  //                                   input: '$sections',
  //                                   as: 'section',
  //                                   cond: {
  //                                     $eq: ['$$section.part', '$$part._id'],
  //                                   },
  //                                 },
  //                               },
  //                               as: 'section',
  //                               in: {
  //                                 _id: '$$section._id',
  //                                 number: '$$section.number',
  //                                 title: '$$section.title',

  //                                 subsections: {
  //                                   $map: {
  //                                     input: {
  //                                       $filter: {
  //                                         input: '$subsections',
  //                                         as: 'sub',
  //                                         cond: {
  //                                           $eq: [
  //                                             '$$sub.section',
  //                                             '$$section._id',
  //                                           ],
  //                                         },
  //                                       },
  //                                     },
  //                                     as: 'sub',
  //                                     in: {
  //                                       _id: '$$sub._id',
  //                                       content: '$$sub.content',

  //                                       schedules: {
  //                                         $filter: {
  //                                           input: '$schedules',
  //                                           as: 'sch',
  //                                           cond: {
  //                                             $eq: [
  //                                               '$$sch.subsection',
  //                                               '$$sub._id',
  //                                             ],
  //                                           },
  //                                         },
  //                                       },
  //                                     },
  //                                   },
  //                                 },
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

  //           // REMOVE EMPTY CHAPTERS
  //           {
  //             $addFields: {
  //               chapters: {
  //                 $filter: {
  //                   input: '$chapters',
  //                   as: 'chapter',
  //                   cond: {
  //                     $gt: [{ $size: '$$chapter.parts' }, 0],
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         ]
  //       : []),

  //     // ------------------- TOTAL COUNTS -------------------
  //     {
  //       $addFields: {
  //         totalChapters: { $size: '$chapters' },

  //         totalParts: {
  //           $sum: {
  //             $map: {
  //               input: '$chapters',
  //               as: 'chapter',
  //               in: { $size: '$$chapter.parts' },
  //             },
  //           },
  //         },

  //         totalSections: {
  //           $sum: {
  //             $map: {
  //               input: '$chapters',
  //               as: 'chapter',
  //               in: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$$chapter.parts',
  //                     as: 'part',
  //                     in: { $size: '$$part.sections' },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },

  //         totalSubsections: {
  //           $sum: {
  //             $map: {
  //               input: '$chapters',
  //               as: 'chapter',
  //               in: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$$chapter.parts',
  //                     as: 'part',
  //                     in: {
  //                       $sum: {
  //                         $map: {
  //                           input: '$$part.sections',
  //                           as: 'section',
  //                           in: {
  //                             $size: '$$section.subsections',
  //                           },
  //                         },
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },

  //         totalSchedules: {
  //           $sum: {
  //             $map: {
  //               input: '$chapters',
  //               as: 'chapter',
  //               in: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$$chapter.parts',
  //                     as: 'part',
  //                     in: {
  //                       $sum: {
  //                         $map: {
  //                           input: '$$part.sections',
  //                           as: 'section',
  //                           in: {
  //                             $sum: {
  //                               $map: {
  //                                 input: '$$section.subsections',
  //                                 as: 'sub',
  //                                 in: {
  //                                   $size: '$$sub.schedules',
  //                                 },
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
  //         },
  //       },
  //     },

  //     // ------------------- PAGINATION -------------------
  //     {
  //       $addFields: {
  //         chapters: {
  //           $slice: ['$chapters', skip, limit],
  //         },
  //       },
  //     },

  //     // ------------------- FINAL OUTPUT -------------------
  //     {
  //       $project: {
  //         title: 1,
  //         year: 1,
  //         description: 1,

  //         totalChapters: 1,
  //         totalParts: 1,
  //         totalSections: 1,
  //         totalSubsections: 1,
  //         totalSchedules: 1,

  //         chapters: 1,
  //       },
  //     },
  //   ]);

  //   const taxLaw = result[0];

  //   if (!taxLaw) {
  //     throw new NotFoundException({
  //       message: 'Tax law not found.',
  //       success: false,
  //       status: 404,
  //     });
  //   }

  //   return taxLaw;
  // }

  // async findLawById(
  //   taxLawId: string,
  //   queryWithPaginationDto: QueryWithPaginationDto,
  // ) {
  //   const { page = 1, limit = 10 } = queryWithPaginationDto;

  //   const skip = (page - 1) * limit;
  //   const id = new Types.ObjectId(taxLawId);

  //   const result = await this.taxLawModel.aggregate([
  //     {
  //       $match: {
  //         _id: id,
  //         status: TaxLawStatus.PUBLISHED,
  //       },
  //     },

  //     // ------------------- NESTED LOOKUPS -------------------
  //     {
  //       $lookup: {
  //         from: 'chapters',
  //         let: { taxLawId: '$_id' },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: { $eq: ['$taxLaw', '$$taxLawId'] },
  //             },
  //           },

  //           // PARTS
  //           {
  //             $lookup: {
  //               from: 'parts',
  //               let: { chapterId: '$_id' },
  //               pipeline: [
  //                 {
  //                   $match: {
  //                     $expr: { $eq: ['$chapter', '$$chapterId'] },
  //                   },
  //                 },

  //                 // SECTIONS
  //                 {
  //                   $lookup: {
  //                     from: 'sections',
  //                     let: { partId: '$_id' },
  //                     pipeline: [
  //                       {
  //                         $match: {
  //                           $expr: { $eq: ['$part', '$$partId'] },
  //                         },
  //                       },

  //                       // SUBSECTIONS
  //                       {
  //                         $lookup: {
  //                           from: 'subsections',
  //                           let: { sectionId: '$_id' },
  //                           pipeline: [
  //                             {
  //                               $match: {
  //                                 $expr: {
  //                                   $eq: ['$section', '$$sectionId'],
  //                                 },
  //                               },
  //                             },

  //                             // SCHEDULES
  //                             // {
  //                             //   $lookup: {
  //                             //     from: 'schedules',
  //                             //     let: { subsectionId: '$_id' },
  //                             //     pipeline: [
  //                             //       {
  //                             //         $match: {
  //                             //           $expr: {
  //                             //             $eq: [
  //                             //               '$subsection',
  //                             //               '$$subsectionId',
  //                             //             ],
  //                             //           },
  //                             //         },
  //                             //       },
  //                             //     ],
  //                             //     as: 'schedules',
  //                             //   },
  //                             // },
  //                           ],
  //                           as: 'subsections',
  //                         },
  //                       },
  //                     ],
  //                     as: 'sections',
  //                   },
  //                 },
  //               ],
  //               as: 'parts',
  //             },
  //           },
  //         ],
  //         as: 'chapters',
  //       },
  //     },

  //     {
  //       $lookup: {
  //         from: 'schedules',
  //         localField: '_id',
  //         foreignField: 'taxLaw',
  //         as: 'schedules',
  //       },
  //     },

  //     // JUST ADDED
  //     {
  //       $addFields: {
  //         chapters: {
  //           $map: {
  //             input: { $ifNull: ['$chapters', []] },
  //             as: 'chapter',
  //             in: {
  //               _id: '$$chapter._id',
  //               number: '$$chapter.number',
  //               title: '$$chapter.title',

  //               parts: '$$chapter.parts',

  //               // ✅ TOTAL PARTS PER CHAPTER
  //               totalParts: {
  //                 $size: { $ifNull: ['$$chapter.parts', []] },
  //               },

  //               // ✅ TOTAL SECTIONS PER CHAPTER
  //               totalSections: {
  //                 $sum: {
  //                   $map: {
  //                     input: { $ifNull: ['$$chapter.parts', []] },
  //                     as: 'part',
  //                     in: {
  //                       $size: {
  //                         $ifNull: ['$$part.sections', []],
  //                       },
  //                     },
  //                   },
  //                 },
  //               },

  //               // ✅ TOTAL SUBSECTIONS PER CHAPTER
  //               // totalSubsections: {
  //               //   $sum: {
  //               //     $map: {
  //               //       input: { $ifNull: ['$$chapter.parts', []] },
  //               //       as: 'part',
  //               //       in: {
  //               //         $sum: {
  //               //           $map: {
  //               //             input: {
  //               //               $ifNull: ['$$part.sections', []],
  //               //             },
  //               //             as: 'section',
  //               //             in: {
  //               //               $size: {
  //               //                 $ifNull: ['$$section.subsections', []],
  //               //               },
  //               //             },
  //               //           },
  //               //         },
  //               //       },
  //               //     },
  //               //   },
  //               // },

  //               // ✅ TOTAL SUBSECTIONS PER CHAPTER (FIXED)
  //               totalSubsections: {
  //                 $reduce: {
  //                   input: { $ifNull: ['$$chapter.parts', []] },
  //                   initialValue: 0,
  //                   in: {
  //                     $add: [
  //                       '$$value',
  //                       {
  //                         $reduce: {
  //                           input: { $ifNull: ['$$this.sections', []] },
  //                           initialValue: 0,
  //                           in: {
  //                             $add: [
  //                               '$$value',
  //                               {
  //                                 $cond: [
  //                                   { $isArray: '$$this.subsections' },
  //                                   { $size: '$$this.subsections' },
  //                                   0,
  //                                 ],
  //                               },
  //                             ],
  //                           },
  //                         },
  //                       },
  //                     ],
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },

  //     // ------------------- TOTAL COUNTS -------------------
  //     {
  //       $addFields: {
  //         totalChapters: {
  //           $size: { $ifNull: ['$chapters', []] },
  //         },

  //         totalParts: {
  //           $sum: {
  //             $map: {
  //               input: { $ifNull: ['$chapters', []] },
  //               as: 'chapter',
  //               in: {
  //                 $size: { $ifNull: ['$$chapter.parts', []] },
  //               },
  //             },
  //           },
  //         },

  //         totalSections: {
  //           $sum: {
  //             $map: {
  //               input: { $ifNull: ['$chapters', []] },
  //               as: 'chapter',
  //               in: {
  //                 $sum: {
  //                   $map: {
  //                     input: {
  //                       $ifNull: ['$$chapter.parts', []],
  //                     },
  //                     as: 'part',
  //                     in: {
  //                       $size: {
  //                         $ifNull: ['$$part.sections', []],
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },

  //         // totalSubsections: {
  //         //   $sum: {
  //         //     $map: {
  //         //       input: { $ifNull: ['$chapters', []] },
  //         //       as: 'chapter',
  //         //       in: {
  //         //         $sum: {
  //         //           $map: {
  //         //             input: {
  //         //               $ifNull: ['$$chapter.parts', []],
  //         //             },
  //         //             as: 'part',
  //         //             in: {
  //         //               $sum: {
  //         //                 $map: {
  //         //                   input: {
  //         //                     $ifNull: ['$$part.sections', []],
  //         //                   },
  //         //                   as: 'section',
  //         //                   in: {
  //         //                     $size: {
  //         //                       $ifNull: ['$$section.subsections', []],
  //         //                     },
  //         //                   },
  //         //                 },
  //         //               },
  //         //             },
  //         //           },
  //         //         },
  //         //       },
  //         //     },
  //         //   },
  //         // },

  //         totalSchedules: {
  //           $size: { $ifNull: ['$schedules', []] },
  //         },
  //       },
  //     },

  //     {
  //       $addFields: {
  //         chapterTotals: {
  //           $map: {
  //             input: { $ifNull: ['$chapters', []] },
  //             as: 'chapter',
  //             in: {
  //               chapterId: '$$chapter._id',

  //               totalSubsections: {
  //                 $sum: {
  //                   $map: {
  //                     input: { $ifNull: ['$$chapter.parts', []] },
  //                     as: 'part',
  //                     in: {
  //                       $sum: {
  //                         $map: {
  //                           input: { $ifNull: ['$$part.sections', []] },
  //                           as: 'section',
  //                           in: {
  //                             $size: {
  //                               $ifNull: ['$$section.subsections', []],
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
  //         },
  //       },
  //     },

  //     // ------------------- PAGINATION -------------------
  //     {
  //       $addFields: {
  //         chapters: {
  //           $slice: ['$chapters', skip, limit],
  //         },
  //       },
  //     },

  //     // ------------------- FINAL OUTPUT -------------------
  //     {
  //       $project: {
  //         title: 1,
  //         year: 1,
  //         description: 1,

  //         totalChapters: 1,
  //         totalParts: 1,
  //         totalSections: 1,
  //         totalSubsections: 1,
  //         totalSchedules: 1,

  //         chapters: 1,
  //       },
  //     },
  //   ]);

  //   const taxLaw = result[0];

  //   if (!taxLaw) {
  //     throw new NotFoundException({
  //       message: 'Tax law not found.',
  //       success: false,
  //       status: 404,
  //     });
  //   }

  //   console.log('taxLaw:', taxLaw);

  //   return taxLaw;
  // }

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

  async findTaxLawChapterByChapterId(chapterId: string) {
    const id = new Types.ObjectId(chapterId);

    const result = await this.chapterModel.aggregate([
      {
        $match: { _id: id },
      },

      // 🔹 Join Parts
      {
        $lookup: {
          from: 'parts',
          localField: '_id',
          foreignField: 'chapter',
          as: 'parts',
        },
      },

      // 🔹 Join Sections inside each Part
      {
        $lookup: {
          from: 'sections',
          localField: 'parts._id',
          foreignField: 'part',
          as: 'sections',
        },
      },

      // 🔹 Join Subsections
      {
        $lookup: {
          from: 'subsections',
          localField: 'sections._id',
          foreignField: 'section',
          as: 'subsections',
        },
      },

      // 🔥 Restructure (VERY IMPORTANT)
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

                      subsections: {
                        $filter: {
                          input: '$subsections',
                          as: 'sub',
                          cond: {
                            $eq: ['$$sub.section', '$$section._id'],
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

      // 🔹 Clean up unwanted flat arrays
      {
        $project: {
          sections: 0,
          subsections: 0,
        },
      },
    ]);

    return result[0];
  }

  async findTaxLaws(queryWithPaginationDto: QueryWithPaginationDto): Promise<{
    taxLaws: any[];
    totalPages: number;
    totalCount: number;
  }> {
    const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

    const skip = (page - 1) * limit;

    const matchStage: any = {
      status: TaxLawStatus.PUBLISHED,
    };

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
    /**
     * Returns the full text of a specific section and its
     * subsections. This is called when the user finally selects a
     * section from the TOC or a search result.
     */
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

  async createDraft(targetId: string, parsed: any) {
    return await this.taxLawModel.create({
      _id: targetId,
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
      status: 'PROCESSING',
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

  // async findLawById(
  //   taxLawId: string,
  //   queryWithPaginationDto: QueryWithPaginationDto,
  // ) {
  //   const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

  //   console.log('searchParams:', searchParams);

  //   const skip = (page - 1) * limit;
  //   const id = new Types.ObjectId(taxLawId);

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

  //     // ------------------- CHAPTERS -------------------
  //     {
  //       $lookup: {
  //         from: 'chapters',
  //         let: { taxLawId: '$_id' },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: { $eq: ['$taxLaw', '$$taxLawId'] },
  //             },
  //           },

  //           // ------------------- PARTS -------------------
  //           {
  //             $lookup: {
  //               from: 'parts',
  //               let: { chapterId: '$_id' },
  //               pipeline: [
  //                 {
  //                   $match: {
  //                     $expr: { $eq: ['$chapter', '$$chapterId'] },
  //                   },
  //                 },

  //                 // ------------------- SECTIONS -------------------
  //                 {
  //                   $lookup: {
  //                     from: 'sections',
  //                     let: { partId: '$_id' },
  //                     pipeline: [
  //                       {
  //                         $match: {
  //                           $expr: { $eq: ['$part', '$$partId'] },
  //                         },
  //                       },

  //                       // ------------------- SUBSECTIONS -------------------
  //                       {
  //                         $lookup: {
  //                           from: 'subsections',
  //                           let: { sectionId: '$_id' },
  //                           pipeline: [
  //                             {
  //                               $match: {
  //                                 $expr: {
  //                                   $eq: [
  //                                     {
  //                                       $cond: [
  //                                         {
  //                                           $eq: [
  //                                             { $type: '$section' },
  //                                             'objectId',
  //                                           ],
  //                                         },
  //                                         '$section',
  //                                         {
  //                                           $toObjectId: '$section',
  //                                         },
  //                                       ],
  //                                     },
  //                                     '$$sectionId',
  //                                   ],
  //                                 },
  //                               },
  //                             },
  //                           ],
  //                           as: 'subsections',
  //                         },
  //                       },
  //                     ],
  //                     as: 'sections',
  //                   },
  //                 },
  //               ],
  //               as: 'parts',
  //             },
  //           },
  //         ],
  //         as: 'chapters',
  //       },
  //     },

  //     // ------------------- REMOVE EMPTY NODES -------------------

  //     {
  //       $addFields: {
  //         chapters: {
  //           $filter: {
  //             input: '$chapters',
  //             as: 'chapter',
  //             cond: {
  //               $gt: [
  //                 {
  //                   $size: {
  //                     $filter: {
  //                       input: '$$chapter.parts',
  //                       as: 'part',
  //                       cond: {
  //                         $gt: [
  //                           {
  //                             $size: {
  //                               $filter: {
  //                                 input: '$$part.sections',
  //                                 as: 'section',
  //                                 cond: {
  //                                   $gt: [
  //                                     {
  //                                       $size: {
  //                                         $ifNull: [
  //                                           '$$section.subsections',
  //                                           [],
  //                                         ],
  //                                       },
  //                                     },
  //                                     0,
  //                                   ],
  //                                 },
  //                               },
  //                             },
  //                           },
  //                           0,
  //                         ],
  //                       },
  //                     },
  //                   },
  //                 },
  //                 0,
  //               ],
  //             },
  //           },
  //         },
  //       },
  //     },

  //     {
  //       $addFields: {
  //         chapters: {
  //           $map: {
  //             input: '$chapters',
  //             as: 'chapter',
  //             in: {
  //               _id: '$$chapter._id',
  //               title: '$$chapter.title',
  //               number: '$$chapter.number',

  //               parts: {
  //                 $map: {
  //                   input: '$$chapter.parts',
  //                   as: 'part',
  //                   in: {
  //                     _id: '$$part._id',
  //                     title: '$$part.title',

  //                     sections: {
  //                       $map: {
  //                         input: '$$part.sections',
  //                         as: 'section',
  //                         in: {
  //                           _id: '$$section._id',
  //                           title: '$$section.title',
  //                           content: '$$section.content',

  //                           subsections: {
  //                             $filter: {
  //                               input: '$$section.subsections',
  //                               as: 'sub',
  //                               cond: searchRegex
  //                                 ? {
  //                                     $regexMatch: {
  //                                       input: '$$sub.content',
  //                                       regex: searchRegex,
  //                                     },
  //                                   }
  //                                 : true,
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
  //         },
  //       },
  //     },
  //     // ------------------- TOTALS (NOW CORRECT) -------------------
  //     {
  //       $addFields: {
  //         chapters: {
  //           $map: {
  //             input: '$chapters',
  //             as: 'chapter',
  //             in: {
  //               _id: '$$chapter._id',
  //               title: '$$chapter.title',
  //               number: '$$chapter.number',
  //               parts: '$$chapter.parts',

  //               totalParts: {
  //                 $size: '$$chapter.parts',
  //               },

  //               totalSections: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$$chapter.parts',
  //                     as: 'part',
  //                     in: {
  //                       $size: '$$part.sections',
  //                     },
  //                   },
  //                 },
  //               },

  //               // ✅ FINAL FIX (WORKS 100%)
  //               totalSubsections: {
  //                 $reduce: {
  //                   input: '$$chapter.parts',
  //                   initialValue: 0,
  //                   in: {
  //                     $add: [
  //                       '$$value',
  //                       {
  //                         $reduce: {
  //                           input: '$$this.sections',
  //                           initialValue: 0,
  //                           in: {
  //                             $add: [
  //                               '$$value',
  //                               {
  //                                 $size: {
  //                                   $ifNull: ['$$this.subsections', []],
  //                                 },
  //                               },
  //                             ],
  //                           },
  //                         },
  //                       },
  //                     ],
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },

  //         totalChapters: { $size: '$chapters' },

  //         totalParts: {
  //           $sum: {
  //             $map: {
  //               input: '$chapters',
  //               as: 'c',
  //               in: { $size: '$$c.parts' },
  //             },
  //           },
  //         },

  //         totalSections: {
  //           $sum: {
  //             $map: {
  //               input: '$chapters',
  //               as: 'c',
  //               in: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$$c.parts',
  //                     as: 'p',
  //                     in: { $size: '$$p.sections' },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },

  //         totalSubsections: {
  //           $sum: {
  //             $map: {
  //               input: '$chapters',
  //               as: 'c',
  //               in: {
  //                 $reduce: {
  //                   input: '$$c.parts',
  //                   initialValue: 0,
  //                   in: {
  //                     $add: [
  //                       '$$value',
  //                       {
  //                         $reduce: {
  //                           input: '$$this.sections',
  //                           initialValue: 0,
  //                           in: {
  //                             $add: [
  //                               '$$value',
  //                               {
  //                                 $size: {
  //                                   $ifNull: ['$$this.subsections', []],
  //                                 },
  //                               },
  //                             ],
  //                           },
  //                         },
  //                       },
  //                     ],
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },

  //     // ------------------- PAGINATION -------------------
  //     {
  //       $addFields: {
  //         chapters: {
  //           $slice: ['$chapters', skip, limit],
  //         },
  //       },
  //     },

  //     {
  //       $project: {
  //         title: 1,
  //         year: 1,
  //         description: 1,

  //         totalChapters: 1,
  //         totalParts: 1,
  //         totalSections: 1,
  //         totalSubsections: 1,

  //         chapters: 1,
  //       },
  //     },
  //   ]);

  //   const taxLaw = result[0];

  //   console.log('taxLaw:', taxLaw);
  //   return taxLaw;
  // }

  // async findLawById(
  //   taxLawId: string,
  //   queryWithPaginationDto: QueryWithPaginationDto,
  // ) {
  //   const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

  //   const skip = (page - 1) * limit;
  //   const id = new Types.ObjectId(taxLawId);

  //   console.log('searchParams:', searchParams);

  //   // ✅ MULTI-WORD SEARCH (production-ready)
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

  //   console.log('searchRegex:', searchRegex);

  //   const result = await this.taxLawModel.aggregate([
  //     {
  //       $match: {
  //         _id: id,
  //         status: TaxLawStatus.PUBLISHED,
  //       },
  //     },

  //     // ------------------- CHAPTERS -------------------
  //     {
  //       $lookup: {
  //         from: 'chapters',
  //         let: { taxLawId: '$_id' },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: { $eq: ['$taxLaw', '$$taxLawId'] },
  //             },
  //           },

  //           // ------------------- PARTS -------------------
  //           {
  //             $lookup: {
  //               from: 'parts',
  //               let: { chapterId: '$_id' },
  //               pipeline: [
  //                 {
  //                   $match: {
  //                     $expr: { $eq: ['$chapter', '$$chapterId'] },
  //                   },
  //                 },

  //                 // ------------------- SECTIONS -------------------
  //                 {
  //                   $lookup: {
  //                     from: 'sections',
  //                     let: { partId: '$_id' },
  //                     pipeline: [
  //                       {
  //                         $match: {
  //                           $expr: { $eq: ['$part', '$$partId'] },
  //                         },
  //                       },

  //                       // ------------------- SUBSECTIONS -------------------
  //                       {
  //                         $lookup: {
  //                           from: 'subsections',
  //                           let: { sectionId: '$_id' },
  //                           pipeline: [
  //                             {
  //                               $match: {
  //                                 $expr: {
  //                                   $eq: [
  //                                     {
  //                                       $cond: [
  //                                         {
  //                                           $eq: [
  //                                             { $type: '$section' },
  //                                             'objectId',
  //                                           ],
  //                                         },
  //                                         '$section',
  //                                         { $toObjectId: '$section' },
  //                                       ],
  //                                     },
  //                                     '$$sectionId',
  //                                   ],
  //                                 },
  //                               },
  //                             },
  //                           ],
  //                           as: 'subsections',
  //                         },
  //                       },
  //                     ],
  //                     as: 'sections',
  //                   },
  //                 },
  //               ],
  //               as: 'parts',
  //             },
  //           },
  //         ],
  //         as: 'chapters',
  //       },
  //     },

  //     // ------------------- APPLY SEARCH -------------------
  //     {
  //       $addFields: {
  //         chapters: {
  //           $map: {
  //             input: '$chapters',
  //             as: 'chapter',
  //             in: {
  //               _id: '$$chapter._id',
  //               title: '$$chapter.title',
  //               number: '$$chapter.number',

  //               parts: {
  //                 $map: {
  //                   input: '$$chapter.parts',
  //                   as: 'part',
  //                   in: {
  //                     _id: '$$part._id',
  //                     title: '$$part.title',

  //                     sections: {
  //                       $map: {
  //                         input: '$$part.sections',
  //                         as: 'section',
  //                         in: {
  //                           _id: '$$section._id',
  //                           title: '$$section.title',
  //                           content: '$$section.content',

  //                           subsections: {
  //                             $filter: {
  //                               input: '$$section.subsections',
  //                               as: 'sub',
  //                               cond: searchRegex
  //                                 ? {
  //                                     $regexMatch: {
  //                                       input: {
  //                                         $concat: [
  //                                           '$$sub.content',
  //                                           ' ',
  //                                           '$$section.title',
  //                                           ' ',
  //                                           '$$part.title',
  //                                           ' ',
  //                                           '$$chapter.title',
  //                                         ],
  //                                       },
  //                                       regex: searchRegex,
  //                                     },
  //                                   }
  //                                 : true,
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
  //         },
  //       },
  //     },

  //     // ------------------- CLEAN EMPTY STRUCTURE -------------------
  //     {
  //       $addFields: {
  //         chapters: {
  //           $map: {
  //             input: '$chapters',
  //             as: 'chapter',
  //             in: {
  //               _id: '$$chapter._id',
  //               title: '$$chapter.title',
  //               number: '$$chapter.number',

  //               parts: {
  //                 $filter: {
  //                   input: {
  //                     $map: {
  //                       input: '$$chapter.parts',
  //                       as: 'part',
  //                       in: {
  //                         _id: '$$part._id',
  //                         title: '$$part.title',

  //                         sections: {
  //                           $filter: {
  //                             input: {
  //                               $map: {
  //                                 input: '$$part.sections',
  //                                 as: 'section',
  //                                 in: {
  //                                   _id: '$$section._id',
  //                                   title: '$$section.title',
  //                                   content: '$$section.content',
  //                                   subsections: '$$section.subsections',
  //                                 },
  //                               },
  //                             },
  //                             as: 'section',
  //                             cond: {
  //                               $gt: [{ $size: '$$section.subsections' }, 0],
  //                             },
  //                           },
  //                         },
  //                       },
  //                     },
  //                   },
  //                   as: 'part',
  //                   cond: {
  //                     $gt: [{ $size: '$$part.sections' }, 0],
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },

  //     {
  //       $addFields: {
  //         chapters: {
  //           $filter: {
  //             input: '$chapters',
  //             as: 'chapter',
  //             cond: {
  //               $gt: [{ $size: '$$chapter.parts' }, 0],
  //             },
  //           },
  //         },
  //       },
  //     },

  //     // ------------------- TOTALS -------------------
  //     {
  //       $addFields: {
  //         chapters: {
  //           $map: {
  //             input: '$chapters',
  //             as: 'chapter',
  //             in: {
  //               _id: '$$chapter._id',
  //               title: '$$chapter.title',
  //               number: '$$chapter.number',
  //               parts: '$$chapter.parts',

  //               totalParts: { $size: '$$chapter.parts' },

  //               totalSections: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$$chapter.parts',
  //                     as: 'p',
  //                     in: { $size: '$$p.sections' },
  //                   },
  //                 },
  //               },

  //               totalSubsections: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$$chapter.parts',
  //                     as: 'p',
  //                     in: {
  //                       $sum: {
  //                         $map: {
  //                           input: '$$p.sections',
  //                           as: 's',
  //                           in: {
  //                             $size: '$$s.subsections',
  //                           },
  //                         },
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },

  //         totalChapters: { $size: '$chapters' },

  //         totalParts: {
  //           $sum: {
  //             $map: {
  //               input: '$chapters',
  //               as: 'c',
  //               in: { $size: '$$c.parts' },
  //             },
  //           },
  //         },

  //         totalSections: {
  //           $sum: {
  //             $map: {
  //               input: '$chapters',
  //               as: 'c',
  //               in: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$$c.parts',
  //                     as: 'p',
  //                     in: { $size: '$$p.sections' },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },

  //         totalSubsections: {
  //           $sum: {
  //             $map: {
  //               input: '$chapters',
  //               as: 'c',
  //               in: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$$c.parts',
  //                     as: 'p',
  //                     in: {
  //                       $sum: {
  //                         $map: {
  //                           input: '$$p.sections',
  //                           as: 's',
  //                           in: {
  //                             $size: '$$s.subsections',
  //                           },
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

  //     // ------------------- PAGINATION -------------------
  //     {
  //       $addFields: {
  //         chapters: {
  //           $slice: ['$chapters', skip, limit],
  //         },
  //       },
  //     },

  //     // ------------------- FINAL OUTPUT -------------------
  //     {
  //       $project: {
  //         title: 1,
  //         year: 1,
  //         description: 1,

  //         totalChapters: 1,
  //         totalParts: 1,
  //         totalSections: 1,
  //         totalSubsections: 1,

  //         chapters: 1,
  //       },
  //     },
  //   ]);

  //   const taxLaw = result[0];
  //   console.log('taxLaw:', taxLaw);

  //   return taxLaw;
  // }

  // async findLawById(
  //   taxLawId: string,
  //   queryWithPaginationDto: QueryWithPaginationDto,
  // ) {
  //   const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;
  //   const skip = (page - 1) * limit;
  //   const id = new Types.ObjectId(taxLawId);

  //   // Pre-compile the regex for performance
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
  //     // 1. Initial Match
  //     {
  //       $match: {
  //         _id: id,
  //         status: TaxLawStatus.PUBLISHED,
  //       },
  //     },

  //     // 2. Parallel Processing with $facet
  //     {
  //       $facet: {
  //         // --- STREAM 1: Global Metadata (Totals) ---
  //         metadata: [
  //           {
  //             $lookup: {
  //               from: 'chapters',
  //               localField: '_id',
  //               foreignField: 'taxLaw',
  //               as: 'chapters',
  //             },
  //           },
  //           {
  //             $project: {
  //               totalChapters: { $size: '$chapters' },
  //               // Note: For deep totals (sections/subsections) without filtering,
  //               // you'd add more lookups here.
  //             },
  //           },
  //         ],

  //         // --- STREAM 2: Filtered & Paginated Content ---
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
  //                     let: { chapterId: '$_id' },
  //                     pipeline: [
  //                       {
  //                         $match: {
  //                           $expr: { $eq: ['$chapter', '$$chapterId'] },
  //                         },
  //                       },
  //                       {
  //                         $lookup: {
  //                           from: 'sections',
  //                           let: { partId: '$_id' },
  //                           pipeline: [
  //                             {
  //                               $match: {
  //                                 $expr: { $eq: ['$part', '$$partId'] },
  //                               },
  //                             },
  //                             {
  //                               $lookup: {
  //                                 from: 'subsections',
  //                                 let: { sectionId: '$_id' },
  //                                 pipeline: [
  //                                   // Subsection Match logic moved inside lookup for optimization
  //                                   {
  //                                     $match: {
  //                                       $expr: {
  //                                         $eq: [
  //                                           { $toObjectId: '$section' },
  //                                           '$$sectionId',
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
  //                             // Only keep sections that have subsections (if searching)
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
  //               ],
  //               as: 'chapters',
  //             },
  //           },
  //           // Apply Pagination to the Chapters array
  //           {
  //             $project: {
  //               title: 1,
  //               year: 1,
  //               description: 1,
  //               chapters: { $slice: ['$chapters', skip, limit] },
  //             },
  //           },
  //         ],
  //       },
  //     },

  //     // 3. Merge results back into a single object
  //     {
  //       $project: {
  //         title: { $arrayElemAt: ['$data.title', 0] },
  //         year: { $arrayElemAt: ['$data.year', 0] },
  //         description: { $arrayElemAt: ['$data.description', 0] },
  //         totalChapters: { $arrayElemAt: ['$metadata.totalChapters', 0] },
  //         chapters: { $arrayElemAt: ['$data.chapters', 0] },
  //       },
  //     },
  //   ]);

  //   const taxLaw = result[0];

  //   console.log('taxLaw:', taxLaw);

  //   return taxLaw;
  // }

  // async findLawById(
  //   taxLawId: string,
  //   queryWithPaginationDto: QueryWithPaginationDto,
  // ) {
  //   const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;
  //   const skip = (page - 1) * limit;
  //   const id = new Types.ObjectId(taxLawId);

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
  //     { $match: { _id: id, status: TaxLawStatus.PUBLISHED } },

  //     {
  //       $facet: {
  //         // --- BRANCH 1: GLOBAL TOTALS (Navigating Hierarchy) ---
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
  //           // Lookup schedules directly from Law
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
  //               // Flatten the nested arrays to get global counts
  //               totalParts: {
  //                 $sum: {
  //                   $map: {
  //                     input: '$chapters',
  //                     as: 'c',
  //                     in: { $size: '$$c.p' },
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
  //                           input: '$$c.p',
  //                           as: 'p',
  //                           in: { $size: '$$p.s' },
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
  //                           input: '$$c.p',
  //                           as: 'p',
  //                           in: {
  //                             $sum: {
  //                               $map: {
  //                                 input: '$$p.s',
  //                                 as: 's',
  //                                 in: { $size: '$$s.ss' },
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
  //                 // Per-Chapter Totals
  //                 {
  //                   $addFields: {
  //                     totalParts: { $size: '$parts' },
  //                     totalSections: {
  //                       $sum: {
  //                         $map: {
  //                           input: '$parts',
  //                           as: 'p',
  //                           in: { $size: '$$p.sections' },
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
  //                                 input: '$$p.sections',
  //                                 as: 's',
  //                                 in: { $size: '$$s.subsections' },
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

  //     // --- FINAL MERGE ---
  //     {
  //       $project: {
  //         title: { $arrayElemAt: ['$data.title', 0] },
  //         year: { $arrayElemAt: ['$data.year', 0] },
  //         description: { $arrayElemAt: ['$data.description', 0] },
  //         // Metadata
  //         totalChapters: { $arrayElemAt: ['$metadata.totalChapters', 0] },
  //         totalParts: { $arrayElemAt: ['$metadata.totalParts', 0] },
  //         totalSections: { $arrayElemAt: ['$metadata.totalSections', 0] },
  //         totalSubsections: { $arrayElemAt: ['$metadata.totalSubsections', 0] },
  //         totalSchedules: { $arrayElemAt: ['$metadata.totalSchedules', 0] },
  //         // Data
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
    console.log('page:', page);
    console.log('limit:', limit);

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
          // --- BRANCH 1: GLOBAL TOTALS (Unfiltered Hierarchy) ---
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
                                  in: { $size: { $ifNull: ['$$s.ss', []] } },
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

          // --- BRANCH 2: FILTERED DATA & PER-CHAPTER TOTALS ---
          data: [
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
                                          ? { content: { $regex: searchRegex } }
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
                          ? [{ $match: { 'sections.0': { $exists: true } } }]
                          : []),
                      ],
                      as: 'parts',
                    },
                  },
                  ...(searchRegex
                    ? [{ $match: { 'parts.0': { $exists: true } } }]
                    : []),
                  // Per-Chapter Totals (including fix for totalSubsections)
                  {
                    $addFields: {
                      totalParts: { $size: '$parts' },
                      totalSections: {
                        $sum: {
                          $map: {
                            input: '$parts',
                            as: 'p',
                            in: { $size: { $ifNull: ['$$p.sections', []] } },
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
                                  input: { $ifNull: ['$$p.sections', []] },
                                  as: 's',
                                  in: {
                                    $size: { $ifNull: ['$$s.subsections', []] },
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

      // --- FINAL MERGE & OUTPUT ---
      {
        $project: {
          _id: { $arrayElemAt: ['$data._id', 0] },
          title: { $arrayElemAt: ['$data.title', 0] },
          year: { $arrayElemAt: ['$data.year', 0] },
          description: { $arrayElemAt: ['$data.description', 0] },
          // Global Totals
          totalChapters: { $arrayElemAt: ['$metadata.totalChapters', 0] },
          totalParts: { $arrayElemAt: ['$metadata.totalParts', 0] },
          totalSections: { $arrayElemAt: ['$metadata.totalSections', 0] },
          totalSubsections: { $arrayElemAt: ['$metadata.totalSubsections', 0] },
          totalSchedules: { $arrayElemAt: ['$metadata.totalSchedules', 0] },
          // Paginated Chapters
          chapters: {
            $slice: [{ $arrayElemAt: ['$data.chapters', 0] }, skip, limit],
          },
        },
      },
    ]);

    const taxLaw = result[0];

    console.log('taxLaw:', taxLaw);
    return taxLaw;
  }
}
