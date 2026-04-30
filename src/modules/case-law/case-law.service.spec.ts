import { Test, TestingModule } from '@nestjs/testing';
import { CaseLawService } from './case-law.service';

describe('CaseLawService', () => {
  let service: CaseLawService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaseLawService],
    }).compile();

    service = module.get<CaseLawService>(CaseLawService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
