import { Test, TestingModule } from '@nestjs/testing';
import { DailyTipsService } from './daily-tips.service';

describe('DailyTipsService', () => {
  let service: DailyTipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyTipsService],
    }).compile();

    service = module.get<DailyTipsService>(DailyTipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
