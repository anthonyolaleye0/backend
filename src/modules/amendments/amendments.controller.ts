import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { Role } from '../users/schemas/user.schema';
import { AmendmentsService } from './amendments.service';
import { CreateAmendmentDto } from './dtos/create-amendment.dto';

@Controller('amendments')
export class AmendmentsController {
  constructor(private readonly service: AmendmentsService) {}

  @Post('create-amendment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Amendment created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create amendment',
    description:
      'This is the endpoint that will be called when admin wanted to create amendment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Amendment created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create amendment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createAmendment(
    @Body() dto: CreateAmendmentDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    return this.service.createAmendment(dto, user.sub.toString());
  }

  /**
   * Resolve content (used by sections/subsections endpoints)
   */
  @Get('resolve/:entityId')
  async resolve(
    @Param('entityId') entityId: string,
    @Query('asOf') asOf?: string,
  ) {
    return this.service.resolve(entityId, asOf ? new Date(asOf) : undefined);
  }
}
