import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { RequireFeature } from '../subscriptions/decorators/require-feature.decorator';
import { FeatureKey } from '../subscriptions/enums/feature.enum';
import { FeatureAccessGuard } from '../subscriptions/guards/feature-access.guard';
import { Role } from '../users/schemas/user.schema';
import { QueryUserTipsDto } from './dtos/query-user-tips.dto';
import { UserDailyTipsService } from './user-daily-tips.service';

@Controller('user-daily-tips')
export class UserDailyTipsController {
  constructor(private readonly userTipService: UserDailyTipsService) {}

  @Get('get-inbox-messages')
  @UseGuards(JwtAuthGuard, FeatureAccessGuard, RolesGuard)
  @RequireFeature(FeatureKey.DAILY_TIPS)
  @Roles(Role.user, Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Messages fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'This is the endpoint for fetching user inbox.',
    description:
      'This endpoint is for fetching user inbox from the database. It can be used by the user that own the inbox.',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch messages.',
  })
  @ApiResponse({
    status: 404,
    description: 'messages not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getInbox(
    @GetCurrentUser() user: JwtUser,
    @Query() query: QueryUserTipsDto,
  ) {
    const response = await this.userTipService.getUserInbox(
      user.sub.toString(),
      query,
    );

    return response;
  }

  @Get('get-inbox-message-details-by-id/:id')
  @UseGuards(JwtAuthGuard, FeatureAccessGuard, RolesGuard)
  @RequireFeature(FeatureKey.DAILY_TIPS)
  @Roles(Role.user, Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Message fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'This is the endpoint for fetching inbox message by ID.',
    description:
      'This endpoint is for fetching inbox message details from the database. It can be used by the user that own the inbox.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch message.',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getTipDetails(
    @GetCurrentUser() user: JwtUser,
    @Param('id') id: string,
  ) {
    const response = await this.userTipService.getTipDetails(
      id,
      user.sub.toString(),
    );

    return response;
  }

  @Delete('delete-inbox-message-by-id/:id')
  @UseGuards(JwtAuthGuard, FeatureAccessGuard, RolesGuard)
  @RequireFeature(FeatureKey.DAILY_TIPS)
  @Roles(Role.user, Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Message deleted successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'This is the endpoint for deleting Message by ID.',
    description:
      'This endpoint is for deleting Message details from the database. It can be used by the user that own the message.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to deleted Message.',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async deleteTip(@GetCurrentUser() user: JwtUser, @Param('id') id: string) {
    const response = await this.userTipService.deleteTipFromInbox(
      id,
      user.sub.toString(),
    );

    return response;
  }
}
