import {
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  Post,
  Query,
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
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../users/schemas/user.schema';
import { TaxLawsService } from './tax-laws.service';

@Controller('tax-laws')
@ApiTags('Tax-Laws')
export class TaxLawsController {
  constructor(private readonly taxLawsService: TaxLawsService) {}
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage(
    'Tax law is being processed. This may take a few minutes for large files.',
  )
  @ApiOperation({
    summary: 'Upload a Tax Law PDF file.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tax law uploaded and processed successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to upload tax law',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },

      fileFilter: (req, file, cb) => {
        if (!file.mimetype.includes('pdf')) {
          return cb(new Error('Only PDF files allowed'), false);
        }

        cb(null, true);
      },
    }),
  )
  async uploadTaxLaw(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'pdf' })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    const upload = await this.taxLawsService.createFullTaxLawDocument(file);
    return upload;
  }

  @Get('get-tax-laws')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax laws fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetching tax laws',
    description:
      'This is the endpoint for fetching all the tax laws on the application.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax laws fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch tax laws.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findTaxLaws(@Query() queryWithPaginationDto: QueryWithPaginationDto) {
    console.log('I am being called for new query...');
    return await this.taxLawsService.findTaxLaws(queryWithPaginationDto);
  }

  @Get('get-tax-law-toc/:taxLawId/toc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law table of content fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Table of content',
    description:
      'This is the endpoint for fetching table of content for a particular tax law.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law table of content fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch tax law table of content.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getTaxLawsTableOfCotent(@Param('taxLawId') taxLawId: string) {
    return await this.taxLawsService.getTaxLawsTableOfCotent(taxLawId);
  }

  @Get('get-tax-law-structure-by-taxId/:taxId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law structure fetched successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetching tax law structure',
    description: 'This is the endpoint for fetching tax law structure.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law structure fetched successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch tax law structure.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getTaxLawStructureByTaxId(@Param('taxId') taxId: string) {
    return await this.taxLawsService.getTaxLawStructureByTaxId(taxId);
  }

  @Get('get-tax-law-section-by-sectionId/:sectionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law section fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get tax law section',
    description:
      'This is the endpoint for fetching a section inside a tax law.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law section fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch tax law section.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getTaxLawSectionBySectionId(@Param('sectionId') sectionId: string) {
    return await this.taxLawsService.getTaxLawSectionBySectionId(sectionId);
  }

  @Get('search-tax-law/:taxLawId/search')
  async searchTaxLaw(@Query() queryWithPaginationDto: QueryWithPaginationDto) {
    return await this.taxLawsService.searchTaxLaw(queryWithPaginationDto);
  }

  @Get('get-tax-law-by-id/:taxLawId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Tax law',
    description:
      'This is the endpoint for fetching content for a particular tax law.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch tax law content.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findLawById(
    @Param('taxLawId') taxLawId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    return await this.taxLawsService.findLawById(
      taxLawId,
      queryWithPaginationDto,
    );
  }

  @Get('get-tax-law-chapter-by-chapter-id/:chapterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law chapter fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetching tax law chapter.',
    description: 'This is the endpoint to fetch a chapter in a tax law.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law chapter fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch tax law chapter.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findTaxLawChapterByChapterId(@Param('chapterId') chapterId: string) {
    return await this.taxLawsService.findTaxLawChapterByChapterId(chapterId);
  }
}
