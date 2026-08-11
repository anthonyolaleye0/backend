import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TaxLawsRepository } from '../tax-laws/repositories/tax-laws.repository';
import { UserDailyTipsService } from '../user-daily-tips/user-daily-tips.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { DailyTipsRepository } from './repositories/daily-tips.repository';

@Injectable()
export class DailyTipsService {
  private readonly logger = new Logger(DailyTipsService.name);

  constructor(
    private readonly dailyTipsRepository: DailyTipsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly taxLawsRepository: TaxLawsRepository,
    private readonly userDailyTipsService: UserDailyTipsService,
    private readonly subscriptionService: SubscriptionsService,
    private mailService: MailService,
  ) {}

  async handleDailyLawPush() {
    this.logger.log('Running daily tax tip job...');
    console.log('Running daily tax tip job...');

    let section = await this.taxLawsRepository.getRandomSection();

    if (!section) return;

    let subSection = await this.taxLawsRepository.getRandomValidSubSection(
      section._id.toString(),
    );

    // =========================
    // IF SECTION IS EXHAUSTED → PICK NEW SECTION
    // =========================
    if (!subSection) {
      this.logger.warn(
        `Section ${section._id.toString()} exhausted. Picking new section...`,
      );

      const allSections = await this.taxLawsRepository.getAllSections();

      let attempts = 0;

      while (attempts < allSections.length) {
        const newSection =
          allSections[Math.floor(Math.random() * allSections.length)];

        const newSubSection =
          await this.taxLawsRepository.getRandomValidSubSection(
            newSection._id.toString(),
          );

        if (newSubSection) {
          section = newSection;
          subSection = newSubSection;
          break;
        }

        attempts++;
      }

      if (!subSection) {
        this.logger.warn('All sections exhausted');
        return;
      }
    }

    // =========================
    // SEND TO USERS WHO ARE ON THE PLANS THAT HAS DAILY TIPS
    // =========================
    // const users = await this.usersRepository.findAllEmailsForDailyTips();
    const users =
      await this.subscriptionService.findSubscribedEmailsForDailyTips();

    console.log('users:', users);
    if (!users || !users.length) {
      console.log('I can not find users and i am returning');
      return;
    }

    const title = section?.title;
    const content = subSection.content;

    for (const user of users) {
      await this.mailService.sendDailyTipsMail({
        to: user.email,
        subject: `Daily Tax Law - ${section?.number}`,
        templateName: 'daily-tip.ejs',
        templateData: {
          section: section?.title,
          subSection: subSection.number,
          content: subSection.content,
        },
      });
    }

    const response = await this.dailyTipsRepository.logTip(
      section?._id.toString(),
      subSection._id.toString(),
      title,
      content,
    );

    const formattedUser = users.map((user) => {
      const obj = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        _id: user._id,
      };

      return obj;
    });

    const createUsersTip =
      await this.userDailyTipsService.createDailyTipForUsers(
        response._id,
        formattedUser,
      );

    this.logger.log(`Sent: ${section?.number} - ${subSection.number}`);
  }
}
