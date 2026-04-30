import { Test, TestingModule } from '@nestjs/testing';
import { AmendmentsService } from './amendments.service';

describe('AmendmentsService', () => {
  let service: AmendmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmendmentsService],
    }).compile();

    service = module.get<AmendmentsService>(AmendmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
