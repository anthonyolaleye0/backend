import { Test, TestingModule } from '@nestjs/testing';
import { CaseLawController } from './case-law.controller';

describe('CaseLawController', () => {
  let controller: CaseLawController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaseLawController],
    }).compile();

    controller = module.get<CaseLawController>(CaseLawController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
