import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireFeature } from '../subscriptions/decorators/require-feature.decorator';
import { FeatureKey } from '../subscriptions/enums/feature.enum';
import { FeatureAccessGuard } from '../subscriptions/guards/feature-access.guard';
import { Role } from '../users/schemas/user.schema';
import { DecidedCasesService } from './decided-cases.service';
import { CreateDecidedCaseDto } from './dtos/create-decided-case.dto';
import { QueryDecidedCasesDto } from './dtos/query-decided-case.dto';

@Controller('decided-cases')
@UseGuards(JwtAuthGuard, FeatureAccessGuard)
export class DecidedCasesController {
  constructor(private readonly decidedCasesService: DecidedCasesService) {}

  @Get('get-all-cases')
  @RequireFeature(FeatureKey.DECIDED_CASES)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Decided cases fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get decided cases',
    description: 'This is the endpoint for fetching all decided cases.',
  })
  @ApiResponse({
    status: 201,
    description: 'Decided cases fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch decided cases.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getCases(@Query() queryDto: QueryDecidedCasesDto) {
    const response = await this.decidedCasesService.getAllCases(queryDto);

    return response;
  }

  @Get('get-case-by-id/:id')
  @RequireFeature(FeatureKey.DECIDED_CASES)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Decided case fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get decided case',
    description: 'This is the endpoint for fetching single decided case.',
  })
  @ApiResponse({
    status: 201,
    description: 'Decided case fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch decided case.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getCaseById(@Param('id') id: string) {
    const response = await this.decidedCasesService.getCaseById(id);

    return response;
  }

  @Post('upload-decided-case')
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Decided case uploaded successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload decided case',
    description:
      'This is the endpoint that admin is going to use to upload decided case.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
        },
        suitNumber: { type: 'string' },
        title: { type: 'string' },
        judgmentDate: { type: 'string' },
        court: { type: 'string' },
        summary: { type: 'string' },
        keywords: { type: 'array' },
        relatedTaxLaws: { type: 'array' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Decided case uploaded successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to upload decided case.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @UseInterceptors(
    FilesInterceptor('file', 1, {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },

      fileFilter: (req, file, cb) => {
        if (!file.mimetype.includes('image/')) {
          return cb(new Error('Only image file is allowed'), false);
        }

        cb(null, true);
      },
    }),
  )
  async createCase(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateDecidedCaseDto,
  ) {
    return this.decidedCasesService.createCase(file, dto);
  }

  @Delete('delete-decided-case-by-id/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Decided case deleted successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'delete decided case',
    description: 'This is the endpoint for deleting decided case.',
  })
  @ApiResponse({
    status: 201,
    description: 'Decided case deleted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to delete decided case.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async deleteCase(@Param('id') id: string) {
    return this.decidedCasesService.deleteCase(id);
  }
}
