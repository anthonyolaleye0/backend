import { Test, TestingModule } from '@nestjs/testing';
import { TaxTipsController } from './tax-tips.controller';

describe('TaxTipsController', () => {
  let controller: TaxTipsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxTipsController],
    }).compile();

    controller = module.get<TaxTipsController>(TaxTipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
