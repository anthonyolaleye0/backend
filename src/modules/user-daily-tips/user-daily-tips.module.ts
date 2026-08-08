import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { UserDailyTipsRepository } from './repositories/user-daily-tips.repository';
import { UserTip, UserTipSchema } from './schemas/user-daily-tips.schema';
import { UserDailyTipsController } from './user-daily-tips.controller';
import { UserDailyTipsService } from './user-daily-tips.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserTip.name, schema: UserTipSchema }]),
    SubscriptionsModule,
    UsersModule,
  ],
  controllers: [UserDailyTipsController],
  providers: [UserDailyTipsService, UserDailyTipsRepository],
  exports: [UserDailyTipsService],
})
export class UserDailyTipsModule {}
