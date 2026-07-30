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
    ] = await Promise.all([
      this.taxLawService.getTaxLawStats(),
      this.taxLawService.getStructureStats(),
      this.usersService.getUserStats(),
      this.taxLawService.getUploadStats(),
      this.taxLawService.getRecentActivity(),
      this.taxLawService.getUploadTrends(),
    ]);

    return {
      taxLawStats,
      structureStats,
      userStats,
      uploadStats,
      recentActivity,
      uploadTrends,
    };
  }
}
