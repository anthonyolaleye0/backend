import { Test, TestingModule } from '@nestjs/testing';
import { DecidedCasesService } from './decided-cases.service';

describe('DecidedCasesService', () => {
  let service: DecidedCasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DecidedCasesService],
    }).compile();

    service = module.get<DecidedCasesService>(DecidedCasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
