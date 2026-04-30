import { Test, TestingModule } from '@nestjs/testing';
import { AmendmentsController } from './amendments.controller';

describe('AmendmentsController', () => {
  let controller: AmendmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmendmentsController],
    }).compile();

    controller = module.get<AmendmentsController>(AmendmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
