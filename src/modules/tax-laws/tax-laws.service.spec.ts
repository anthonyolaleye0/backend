import { Test, TestingModule } from '@nestjs/testing';
import { TaxLawsService } from './tax-laws.service';

describe('TaxLawsService', () => {
  let service: TaxLawsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxLawsService],
    }).compile();

    service = module.get<TaxLawsService>(TaxLawsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
