import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TaxLawsRepository } from '../../tax-laws/repositories/tax-laws.repository';
import { DailyTip, DailyTipDocument } from '../schemas/daily-tips.schema';

@Injectable()
export class DailyTipsRepository {
  constructor(
    @InjectModel(DailyTip.name)
    private readonly dailyTipsModel: Model<DailyTipDocument>,

    @Inject(forwardRef(() => TaxLawsRepository))
    private readonly taxLawsRepository: TaxLawsRepository,
  ) {}

  private COOLDOWN_DAYS = 20;

  async getNextDailyContent() {
    const lastTip = await this.dailyTipsModel.findOne().sort({ sentDate: -1 });

    let currentSection;

    if (!lastTip) {
      currentSection = await this.taxLawsRepository.getSectionForDailyTips();
    } else {
      currentSection = await this.taxLawsRepository.findSectionById(
        lastTip.sectionId.toString(),
      );
    }

    if (!currentSection) {
      return null;
    }

    const allSubSections =
      await this.taxLawsRepository.findAllSubSectionsInASectionUsingSectionId(
        currentSection._id,
      );

    const sentSubSections = await this.dailyTipsModel.find({
      sectionId: currentSection._id,
    });

    const sentIds = sentSubSections.map((s) => s.subSectionId?.toString());

    // 4. Filter remaining subsections
    const remaining = allSubSections.filter(
      (sub) => !sentIds.includes(sub._id.toString()),
    );

    let chosenSubSection;

    // 5. If all subsections exhausted → move to next section
    if (remaining.length === 0) {
      const nextSection = await this.taxLawsRepository.getSectionForDailyTips();

      if (!nextSection) return null;

      const nextSubSections =
        await this.taxLawsRepository.findAllSubSectionsInASectionUsingSectionId(
          nextSection._id,
        );

      // pick random from new section
      chosenSubSection =
        nextSubSections[Math.floor(Math.random() * nextSubSections.length)];

      return {
        section: nextSection,
        subSection: chosenSubSection,
      };
    }

    // 6. Pick RANDOM subsection
    chosenSubSection = remaining[Math.floor(Math.random() * remaining.length)];

    return {
      section: currentSection,
      subSection: chosenSubSection,
    };
  }

  async logDailyTip(
    sectionId: Types.ObjectId,
    subSectionId: Types.ObjectId,
    sentDate: Date,
    totalRecipients: number,
  ) {
    const response = await new this.dailyTipsModel({
      sectionId,
      subSectionId,
      sentDate,
      totalRecipients,
    }).save();

    return response;
  }

  async getOneUnsentTip() {
    const tips = await this.dailyTipsModel.aggregate([
      { $match: { sent: false } },
      { $sample: { size: 1 } },
    ]);

    return tips[0] || null;
  }

  // Mark as sent
  async markAsSent(id: string) {
    return this.dailyTipsModel.findByIdAndUpdate(id, {
      sent: true,
      sentAt: new Date(),
    });
  }

  // check if subsection was sent recently
  async wasRecentlySent(subSectionId: string): Promise<boolean> {
    const date = new Date();
    date.setDate(date.getDate() - this.COOLDOWN_DAYS);

    const exists = await this.dailyTipsModel.findOne({
      subSectionId,
      sentAt: { $gte: date },
    });

    return !!exists;
  }

  async getRecentlySentSubSections(sectionId: string) {
    const date = new Date();
    date.setDate(date.getDate() - this.COOLDOWN_DAYS);

    const tips = await this.dailyTipsModel.find({
      sectionId,
      sentAt: { $gte: date },
    });

    return tips.map((t) => t.subSectionId.toString());
  }

  // save sent tip
  async logTip(sectionId: string, subSectionId: string) {
    return new this.dailyTipsModel({
      sectionId: new Types.ObjectId(sectionId),
      subSectionId: new Types.ObjectId(subSectionId),
      sentAt: new Date(),
    }).save();
  }

  async isSectionExhausted(sectionId: string, totalSubSections: number) {
    const sent = await this.dailyTipsModel.countDocuments({
      sectionId: new Types.ObjectId(sectionId),
    });

    return sent >= totalSubSections;
  }
}
