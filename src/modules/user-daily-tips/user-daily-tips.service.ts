import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryUserTipsDto } from './dtos/query-user-tips.dto';
import { UserDailyTipsRepository } from './repositories/user-daily-tips.repository';

@Injectable()
export class UserDailyTipsService {
  constructor(private readonly userTipRepo: UserDailyTipsRepository) {}

  async createDailyTipForUsers(
    tipId: Types.ObjectId,
    users: {
      _id: Types.ObjectId;
      lastName: string;
      email: string;
      firstName: string;
    }[],
  ) {
    if (!users.length) {
      throw new NotFoundException({
        message: 'Users not found.',
        success: false,
        status: 404,
      });
    }

    const response = await this.userTipRepo.createDailyTipForUsers(
      tipId,
      users,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to create daily tips for users.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async getUserInbox(userId: string, query: QueryUserTipsDto) {
    const response = await this.userTipRepo.getUserInbox(userId, query);

    return response;
  }

  async getTipDetails(userTipId: string, userId: string) {
    const tip = await this.userTipRepo.findUserTipById(userTipId, userId);

    if (!tip) {
      throw new NotFoundException({
        message: 'Tip not found in your inbox.',
        success: false,
        status: 404,
      });
    }

    if (!tip.isRead) {
      await this.userTipRepo.markAsRead(userTipId, userId);
      tip.isRead = true;
      tip.readAt = new Date();
    }

    return tip;
  }

  async deleteTipFromInbox(userTipId: string, userId: string) {
    const deleted = await this.userTipRepo.softDeleteTip(userTipId, userId);
    if (!deleted) {
      throw new NotFoundException({
        message: 'Tip not found or already deleted',
        success: false,
        status: 404,
      });
    }
    return { success: true, message: 'Tip removed from inbox' };
  }
}
