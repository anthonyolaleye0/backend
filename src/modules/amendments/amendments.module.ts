import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxLawsModule } from '../tax-laws/tax-laws.module';
import { AmendmentsController } from './amendments.controller';
import { AmendmentsService } from './amendments.service';
import { AmendmentRepository } from './repositories/amendment.repository';
import { Amendment, AmendmentSchema } from './schemas/amendment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Amendment.name, schema: AmendmentSchema },
    ]),
    TaxLawsModule,
  ],
  controllers: [AmendmentsController],
  providers: [AmendmentsService, AmendmentRepository],
})
export class AmendmentsModule {}
