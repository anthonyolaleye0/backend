import { SetMetadata } from '@nestjs/common';
import { FeatureKey } from '../enums/feature.enum';

export const REQUIRE_FEATURE_KEY = 'require_feature';
export const RequireFeature = (feature: FeatureKey) =>
  SetMetadata(REQUIRE_FEATURE_KEY, feature);
