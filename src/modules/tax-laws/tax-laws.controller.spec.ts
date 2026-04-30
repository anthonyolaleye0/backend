import { Test, TestingModule } from '@nestjs/testing';
import { TaxLawsController } from './tax-laws.controller';

describe('TaxLawsController', () => {
  let controller: TaxLawsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxLawsController],
    }).compile();

    controller = module.get<TaxLawsController>(TaxLawsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
