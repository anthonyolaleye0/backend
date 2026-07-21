import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Types } from 'mongoose';
import { TaxLawsRepository } from '../repositories/tax-laws.repository';

// tax-law.processor.ts
@Processor('tax-law-queue')
export class TaxLawProcessor {
  constructor(
    private readonly repository: TaxLawsRepository, // Inject only the repository
  ) {}

  @Process({ name: 'process-tax-law', concurrency: 1 })
  async handleProcessTaxLaw(job: Job<any>): Promise<any> {
    const { parsed, taxLawId } = job.data;

    if (!parsed || !taxLawId) {
      console.error('Invalid job payload');
      return;
    }

    try {
      const taxLaw = await this.repository.createDraft(taxLawId, parsed);

      if (!taxLaw) {
        console.error('Tax law update failed');
        return;
      }

      let totalSectionsCount = 0;

      console.log('parsed.chapters[0]:', parsed.chapters[0]);
      console.log('parsed.chapters[0].parts[0]:', parsed.chapters[0].parts[0]);
      console.log('parsed.chapters[0].parts[0]:', parsed.chapters[0].parts[0]);

      for (const ch of parsed.chapters || []) {
        const lastChapter = await this.repository.getLastChapterOrder(taxLawId);

        const chapter = await this.repository.createChapter({
          taxLaw: taxLaw._id,
          order: lastChapter ? lastChapter.order + 1 : 1,
          ...ch,
        });

        for (const pt of ch.parts || []) {
          const lastPart = await this.repository.getLastPartOrder(
            chapter._id.toString(),
          );

          const part = await this.repository.createPart({
            chapter: chapter._id,
            order: lastPart ? lastPart.order + 1 : 1,
            ...pt,
          });

          const sectionData = pt.sections.map((sec) => ({
            ...sec,
            part: part._id,
            taxLaw: taxLaw._id,
          }));

          const lastSection = await this.repository.getLastSectionOrder(
            part._id.toString(),
          );

          // const createdSections =
          //   await this.repository.insertSections(sectionData);

          const createdSections = await this.repository.insertSections(
            sectionData.map((s, index) => ({
              ...s,
              order: lastSection ? lastSection.order + index + 1 : index + 1,
            })),
          );
          totalSectionsCount += createdSections.length;

          const subsections: any[] = [];
          createdSections.forEach((s, idx) => {
            const rawSub = pt.sections[idx].subsections || [];

            rawSub.forEach((sub, subIndex) =>
              subsections.push({ ...sub, section: s._id, order: subIndex + 1 }),
            );
          });

          if (subsections.length > 0) {
            console.log('subsections.length:', subsections.length);
            await this.repository.insertSubSections(subsections);
          }
        }
      }

      if (parsed.schedules && parsed.schedules.length > 0) {
        const scheduleData = parsed.schedules.map((sch) => ({
          ...sch,
          taxLaw: taxLaw._id, // Link each schedule to the parent Tax Law
        }));

        await this.repository.insertSchedules(scheduleData);
      }

      await this.repository.publishLaw(taxLaw._id, totalSectionsCount);
      return { success: true, taxLawId };
    } catch (error) {
      await this.repository.markAsFailed(new Types.ObjectId(taxLawId));
      throw error;
    }
  }

  @OnQueueFailed()
  async onJobFailed(job: Job, error: Error) {
    const { targetId } = job.data;
    const orphanedLaw = await this.repository.findProcessingLaw(targetId);

    if (orphanedLaw) {
      const id = orphanedLaw._id;
      const relatedIds = await this.repository.getRelatedIds(id);

      await this.repository.purgeLawData(id, relatedIds);

      console.error(
        `CLEANUP: Scrubbed Tax Law [${id.toString()}] due to: ${error.message}`,
      );
    }
  }
}
