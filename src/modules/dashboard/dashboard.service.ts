import { Injectable } from '@nestjs/common';
import { TaxLawsService } from '../tax-laws/tax-laws.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly taxLawService: TaxLawsService,
    private readonly usersService: UsersService,
  ) {}
  async getDashboardStats() {
    const [
      taxLawStats,
      structureStats,
      userStats,
      uploadStats,
      recentActivity,
      uploadTrends,
      sectionsPerTaxLaw,
      chaptersPerTaxLaw,
      partsPerTaxLaw,
      subSectionsPerTaxLaw,
    ] = await Promise.all([
      this.taxLawService.getTaxLawStats(),
      this.taxLawService.getStructureStats(),
      this.usersService.getUserStats(),
      this.taxLawService.getUploadStats(),
      this.taxLawService.getRecentActivity(),
      this.taxLawService.getUploadTrends(),
      this.taxLawService.getCountsPerTaxLaw('sections'),
      this.taxLawService.getCountsPerTaxLaw('chapters'),
      this.taxLawService.getCountsPerTaxLaw('parts'),
      this.taxLawService.getCountsPerTaxLaw('subsections'),
    ]);

    console.log('chaptersPerTaxLaw:', chaptersPerTaxLaw);
    console.log('partsPerTaxLaw:', partsPerTaxLaw);
    console.log('sectionsPerTaxLaw:', sectionsPerTaxLaw);
    console.log('subSectionsPerTaxLaw:', subSectionsPerTaxLaw);

    return {
      taxLawStats,
      structureStats,
      userStats,
      uploadStats,
      recentActivity,
      uploadTrends,
      sectionsPerTaxLaw,
      chaptersPerTaxLaw,
      partsPerTaxLaw,
      subSectionsPerTaxLaw,
    };
  }
}
