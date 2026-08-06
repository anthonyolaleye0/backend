import { Test, TestingModule } from '@nestjs/testing';
import { UserDailyTipsService } from './user-daily-tips.service';

describe('UserDailyTipsService', () => {
  let service: UserDailyTipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserDailyTipsService],
    }).compile();

    service = module.get<UserDailyTipsService>(UserDailyTipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
