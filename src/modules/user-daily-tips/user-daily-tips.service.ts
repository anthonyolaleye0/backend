import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { UserDailyTipsRepository } from './repositories/user-daily-tips.repository';

@Injectable()
export class UserDailyTipsService {
  constructor(
    private readonly userDailyTipsRepo: UserDailyTipsRepository,
    private readonly usersService: UsersService,
  ) {}

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

    const response = await this.userDailyTipsRepo.createDailyTipForUsers(
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
  }
}
