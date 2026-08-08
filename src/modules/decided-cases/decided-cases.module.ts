import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from '../../common/infrastructure/cloudinary/cloudinary.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DecidedCasesController } from './decided-cases.controller';
import { DecidedCasesService } from './decided-cases.service';
import { DecidedCaseRepository } from './repositories/decided-case.repository';
import { DecidedCase, DecidedCaseSchema } from './schemas/deicded-case.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DecidedCase.name, schema: DecidedCaseSchema },
    ]),
    CloudinaryModule,
    SubscriptionsModule,
  ],

  controllers: [DecidedCasesController],
  providers: [DecidedCasesService, DecidedCaseRepository],
})
export class DecidedCasesModule {}
