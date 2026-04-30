import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { TaxLawsRepository } from '../repositories/tax-laws.repository';

// tax-law.processor.ts
@Processor('tax-law-queue')
export class TaxLawProcessor {
  constructor(
    private readonly repository: TaxLawsRepository, // Inject only the repository
  ) {}

  @Process({ name: 'process-tax-law', concurrency: 1 })
  async handleProcessTaxLaw(job: Job<any>): Promise<any> {
    const { parsed, targetId } = job.data;
    let taxLawId;

    try {
      const taxLaw = await this.repository.createDraft(targetId, parsed);
      taxLawId = taxLaw._id;

      let totalSectionsCount = 0;

      console.log('parsed.chapters[0]:', parsed.chapters[0]);
      console.log('parsed.chapters[0].parts[0]:', parsed.chapters[0].parts[0]);
      console.log('parsed.chapters[0].parts[0]:', parsed.chapters[0].parts[0]);

      for (const ch of parsed.chapters || []) {
        const chapter = await this.repository.createChapter({
          taxLaw: taxLawId,
          ...ch,
        });

        for (const pt of ch.parts || []) {
          const part = await this.repository.createPart({
            chapter: chapter._id,
            ...pt,
          });

          const sectionData = pt.sections.map((sec) => ({
            ...sec,
            part: part._id,
            taxLaw: taxLawId,
          }));

          const createdSections =
            await this.repository.insertSections(sectionData);
          totalSectionsCount += createdSections.length;

          const subsections: any[] = [];
          createdSections.forEach((s, idx) => {
            const rawSub = pt.sections[idx].subsections || [];
            rawSub.forEach((sub) =>
              subsections.push({ ...sub, section: s._id }),
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
          taxLaw: taxLawId, // Link each schedule to the parent Tax Law
        }));

        await this.repository.insertSchedules(scheduleData);
      }

      await this.repository.publishLaw(taxLawId, totalSectionsCount);
      return { success: true, taxLawId };
    } catch (error) {
      await this.repository.markAsFailed(taxLawId);
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
