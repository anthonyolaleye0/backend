import { Test, TestingModule } from '@nestjs/testing';
import { DecidedCasesController } from './decided-cases.controller';

describe('DecidedCasesController', () => {
  let controller: DecidedCasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DecidedCasesController],
    }).compile();

    controller = module.get<DecidedCasesController>(DecidedCasesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
