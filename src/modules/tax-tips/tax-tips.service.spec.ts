import { Test, TestingModule } from '@nestjs/testing';
import { TaxTipsService } from './tax-tips.service';

describe('TaxTipsService', () => {
  let service: TaxTipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxTipsService],
    }).compile();

    service = module.get<TaxTipsService>(TaxTipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
