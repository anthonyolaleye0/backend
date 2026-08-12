import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { UpdatePlanDto } from './dtos/update-plan.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // Public/Authenticated: Get available plans
  @Get('get-plans')
  async getPlans() {
    const response = await this.subscriptionsService.getAllActivePlans();

    return response;
  }

  // Authenticated User: Get current subscription status
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('get-my-status')
  async getMySubscription(@GetCurrentUser() user: JwtUser) {
    const response = await this.subscriptionsService.getUserCurrentSubscription(
      user.sub.toString(),
    );

    return response;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch('update-plan/:id')
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    const response = await this.subscriptionsService.updatePlan(
      id,
      updatePlanDto,
    );

    return response;
  }
}
