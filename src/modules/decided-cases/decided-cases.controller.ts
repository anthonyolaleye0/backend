import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Get('get-all-decided-cases')
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

    console.log('getCases:', response);

    return response;
  }

  @Get('get-decided-case-by-id/:id')
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

  @Get('get-decided-case-stream-by-id/:id')
  @RequireFeature(FeatureKey.DECIDED_CASES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Stream decided case PDF',
    description:
      'Streams the Cloudinary PDF binary directly to avoid browser CORS restrictions.',
  })
  async streamCasePdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, contentType, fileName } =
      await this.decidedCasesService.getCasePdfStream(id);

    res.setHeader('Content-Type', contentType || 'application/pdf');
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate',
    );

    return res.end(buffer);
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
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),

      limits: {
        fileSize: 15 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Invalid file type. Only PDF and Word documents (.pdf, .doc, .docx) are allowed.',
            ),
            false,
          );
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
