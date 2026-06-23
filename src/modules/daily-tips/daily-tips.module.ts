import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from '../../mail/mail.module';
import { TaxLawsModule } from '../tax-laws/tax-laws.module';
import { UsersModule } from '../users/users.module';
import { DailyTipsCronService } from './cron/daily-tips-cron.service';
import { DailyTipsController } from './daily-tips.controller';
import { DailyTipsService } from './daily-tips.service';
import { DailyTipsRepository } from './repositories/daily-tips.repository';
import { DailyTip, DailyTipSchema } from './schemas/daily-tips.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyTip.name, schema: DailyTipSchema },
    ]),
    UsersModule,
    MailModule,

    forwardRef(() => TaxLawsModule),
  ],
  controllers: [DailyTipsController],
  providers: [DailyTipsService, DailyTipsRepository, DailyTipsCronService],
  exports: [DailyTipsService, DailyTipsRepository],
})
export class DailyTipsModule {}
