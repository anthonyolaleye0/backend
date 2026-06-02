import { Test, TestingModule } from '@nestjs/testing';
import { DailyTipsController } from './daily-tips.controller';

describe('DailyTipsController', () => {
  let controller: DailyTipsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyTipsController],
    }).compile();

    controller = module.get<DailyTipsController>(DailyTipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
