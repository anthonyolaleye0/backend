import { FeatureKey } from '../enums/feature.enum';
import { PlanTier } from '../enums/plan-name.enum';

export const DEFAULT_PLANS = [
  {
    tier: PlanTier.BASIC,
    name: 'Basic Plan',
    description: 'Essential access to tax laws and daily tips.',
    amount: 15000, // ₦15,000 / year
    durationInDays: 365,
    allowedFeatures: [FeatureKey.DAILY_TIPS, FeatureKey.BASIC_SEARCH],
    isActive: true,
  },
  {
    tier: PlanTier.PREMIUM,
    name: 'Premium Plan',
    description: 'Includes decided cases, advanced search, and PDF exports.',
    amount: 35000, // ₦35,000 / year
    durationInDays: 365,
    allowedFeatures: [
      FeatureKey.DAILY_TIPS,
      FeatureKey.BASIC_SEARCH,
      FeatureKey.ADVANCED_SEARCH,
      FeatureKey.DECIDED_CASES,
      FeatureKey.EXPORT_PDF,
    ],
    isActive: true,
  },
  {
    tier: PlanTier.SUPER,
    name: 'Super Plan',
    description: 'Full unrestricted access to all tax tools and calculators.',
    amount: 75000, // ₦75,000 / year
    durationInDays: 365,
    allowedFeatures: [
      FeatureKey.DAILY_TIPS,
      FeatureKey.BASIC_SEARCH,
      FeatureKey.ADVANCED_SEARCH,
      FeatureKey.DECIDED_CASES,
      FeatureKey.EXPORT_PDF,
      FeatureKey.TAX_CALCULATOR,
    ],
    isActive: true,
  },
];
