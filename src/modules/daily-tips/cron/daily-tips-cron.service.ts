import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { DailyTipsService } from '../daily-tips.service';

@Injectable()
export class DailyTipsCronService implements OnModuleInit {
  private readonly logger = new Logger(DailyTipsCronService.name);

  constructor(private readonly dailyTipsService: DailyTipsService) {}

  onModuleInit() {
    this.logger.log('Registering node-cron job...');

    cron.schedule(
      // '* * * * *', // 12 noon daily
      '0 12 * * *', // 12 noon daily
      async () => {
        this.logger.log('Running daily tax tip job...');
        await this.dailyTipsService.handleDailyLawPush();
      },
      {
        timezone: 'Africa/Lagos',
      },
    );
  }
}
