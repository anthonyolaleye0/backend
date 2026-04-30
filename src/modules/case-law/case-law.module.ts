import { Module } from '@nestjs/common';
import { CaseLawController } from './case-law.controller';
import { CaseLawService } from './case-law.service';

@Module({
  controllers: [CaseLawController],
  providers: [CaseLawService]
})
export class CaseLawModule {}
