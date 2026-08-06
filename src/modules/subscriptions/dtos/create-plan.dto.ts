// create-plan.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { FeatureKey } from '../enums/feature.enum';
import { PlanTier } from '../enums/plan-name.enum';

export class CreatePlanDto {
  @ApiProperty({
    description: 'This is the enum of the plan.',
    example: PlanTier.BASIC,
  })
  tier!: PlanTier;

  @ApiProperty({
    description: 'This is the name of the plan.',
    example: 'Basic Plan',
  })
  name!: string;

  @ApiProperty({
    description: 'This is the price of the plan.',
    example: 15000,
  })
  price!: number;

  @ApiProperty({
    description:
      'This is the features that the user will have access to when on the plan.',
    example: FeatureKey.DECIDED_CASES,
  })
  features!: FeatureKey[];
}
