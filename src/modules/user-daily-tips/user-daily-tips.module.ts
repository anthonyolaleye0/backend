import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { UserDailyTipsRepository } from './repositories/user-daily-tips.repository';
import {
  UserDailyTip,
  UserDailyTipSchema,
} from './schemas/user-daily-tips.schema';
import { UserDailyTipsController } from './user-daily-tips.controller';
import { UserDailyTipsService } from './user-daily-tips.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDailyTip.name, schema: UserDailyTipSchema },
    ]),

    UsersModule,
  ],
  controllers: [UserDailyTipsController],
  providers: [UserDailyTipsService, UserDailyTipsRepository],
  exports: [UserDailyTipsService],
})
export class UserDailyTipsModule {}
