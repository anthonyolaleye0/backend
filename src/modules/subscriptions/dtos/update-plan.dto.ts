import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FeatureKey } from '../enums/feature.enum';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(FeatureKey, { each: true })
  allowedFeatures?: FeatureKey[];

  @IsOptional()
  @IsString()
  paystackPlanCode?: string;
}
