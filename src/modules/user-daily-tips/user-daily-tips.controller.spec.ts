import { Test, TestingModule } from '@nestjs/testing';
import { UserDailyTipsController } from './user-daily-tips.controller';

describe('UserDailyTipsController', () => {
  let controller: UserDailyTipsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserDailyTipsController],
    }).compile();

    controller = module.get<UserDailyTipsController>(UserDailyTipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
