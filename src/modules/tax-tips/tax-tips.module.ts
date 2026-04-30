import { Module } from '@nestjs/common';
import { TaxTipsController } from './tax-tips.controller';
import { TaxTipsService } from './tax-tips.service';

@Module({
  controllers: [TaxTipsController],
  providers: [TaxTipsService]
})
export class TaxTipsModule {}
