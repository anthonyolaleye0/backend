import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  Post,
  Put,
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
import { NormalizeDtoPipe } from '../../common/pipes/normalize-dto.pipe';
import { Role } from '../users/schemas/user.schema';
import { CreateChapterDto } from './dtos/create-chapter.dto';
import { CreatePartDto } from './dtos/create-part.dto';
import { CreateScheduleDto } from './dtos/create-schedule.dto';
import { CreateSectionDto } from './dtos/create-section.dto';
import { CreateSubSectionDto } from './dtos/create-subsection.dto';
import { UpdateChapterDto } from './dtos/update-chapter.dto';
import { UpdatePartDto } from './dtos/update-part.dto';
import { UpdateScheduleDto } from './dtos/update-schedule.dto';
import { UpdateSectionDto } from './dtos/update-section.dto';
import { UpdateSubSectionDto } from './dtos/update-subsection.dto';
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
  @Get('get-tax-law-schedule-by-scheduleId/:scheduleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law schedule fetched successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetching tax law schedule',
    description: 'This is the endpoint for fetching tax law schedule.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law schedule fetched successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch tax law schedule.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getTaxLawScheduleByScheduleId(@Param('scheduleId') scheduleId: string) {
    return await this.taxLawsService.getTaxLawScheduleByScheduleId(scheduleId);
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
    const section =
      await this.taxLawsService.getTaxLawSectionBySectionId(sectionId);

    return section;
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
  @Get('get-tax-law-schedules-by-taxLawId/:taxLawId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law schedules fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Tax law schedules',
    description:
      'This is the endpoint for fetching content for tax law schedules.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law schedules fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch tax law schedules.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findLawSchedulesByTaxLawId(
    @Param('taxLawId') taxLawId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const response = await this.taxLawsService.findLawSchedulesByTaxLawId(
      taxLawId,
      queryWithPaginationDto,
    );

    console.log('response:', response);
    return response;
  }

  @Get('get-tax-law-chapter-history-by-chapter-id/:chapterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law chapter history fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetching tax law chapter history.',
    description:
      'This is the endpoint to fetch history of a chapter in a tax law.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law chapter history fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch tax law chapter history.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getChapterHistory(@Param('chapterId') chapterId: string) {
    return await this.taxLawsService.getChapterHistory(chapterId);
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
  async findTaxLawChapterByChapterId(
    @Param('chapterId') chapterId: string,
    @Query('asOf') asOf?: string,
  ) {
    return await this.taxLawsService.findTaxLawChapterByChapterId(
      chapterId,
      asOf ? new Date(asOf) : undefined,
    );
  }

  @Put('update-tax-law-subsection-by-subsection-id/:subsectionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law sub section updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update tax law sub section.',
    description:
      'This is the endpoint for updating tax law sub section using subsectionId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law sub section updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to update tax law subsection.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateSubSection(
    @Param('subsectionId') subsectionId: string,
    @Body() updateSubSectionDto: UpdateSubSectionDto,
  ) {
    const response = await this.taxLawsService.updateSubSection(
      subsectionId,
      updateSubSectionDto,
    );

    console.log('controller response:', response);

    return response;
  }

  @Put('update-tax-law-section-by-section-id/:sectionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law section updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update tax law section.',
    description:
      'This is the endpoint for updating tax law section using sectionId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law section updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to update tax law section.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateSection(
    @Param('sectionId') sectionId: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    const response = await this.taxLawsService.updateSection(
      sectionId,
      updateSectionDto,
    );

    console.log('controller response:', response);

    return response;
  }
  @Put('update-tax-law-schedule-by-schedule-id/:scheduleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law schedule updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update tax law schedule.',
    description:
      'This is the endpoint for updating tax law schedule using scheduleId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law schedule updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to update tax law schedule.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateSchedule(
    @Param('scheduleId') scheduleId: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    console.log('controller updateScheduleDto:', updateScheduleDto);
    const response = await this.taxLawsService.updateSchedule(
      scheduleId,
      updateScheduleDto,
    );

    console.log('controller response:', response);

    return response;
  }
  @Put('update-tax-law-chapter-by-chapter-id/:chapterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law chapter updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update tax law chapter.',
    description:
      'This is the endpoint for updating tax law chapter using chapterId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law chapter updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to update tax law chapter.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateChapter(
    @Param('chapterId') chapterId: string,
    @Body() updateChapterDto: UpdateChapterDto,
  ) {
    const response = await this.taxLawsService.updateChapter(
      chapterId,
      updateChapterDto,
    );

    console.log('controller response:', response);

    return response;
  }
  @Put('update-tax-law-part-by-part-id/:partId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law part updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update tax law part.',
    description: 'This is the endpoint for updating tax law part using partId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law part updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to update tax law part.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updatePart(
    @Param('partId') partId: string,
    @Body() updatePartDto: UpdatePartDto,
  ) {
    const response = await this.taxLawsService.updatePart(
      partId,
      updatePartDto,
    );

    console.log('controller response:', response);

    return response;
  }

  @Post('create-tax-law-subsection-in-section-by-section-id/:sectionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law sub section created successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create tax law sub section in a section.',
    description:
      'This is the endpoint for creating tax law sub section in section using sectionId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law sub section created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create tax law sub section.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createSubsectionUsingSectionId(
    @Param('sectionId') sectionId: string,
    @Body(new NormalizeDtoPipe()) createSubSectionDto: CreateSubSectionDto,
  ) {
    console.log('controller createSubSectionDto:', createSubSectionDto);
    const response = await this.taxLawsService.createSubsectionUsingSectionId(
      sectionId,
      createSubSectionDto,
    );

    console.log('controller response:', response);

    return response;
  }

  @Post('create-tax-law-section-in-part-by-part-id/:partId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law section created successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create tax law section in a section.',
    description:
      'This is the endpoint for creating tax law section in part using partId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law section created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create tax law section.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createSectionUsingPartId(
    @Param('partId') partId: string,
    @Body(new NormalizeDtoPipe()) createSectionDto: CreateSectionDto,
  ) {
    console.log('controller createSubSectionDto:', createSectionDto);
    const response = await this.taxLawsService.createSectionUsingPartId(
      partId,
      createSectionDto,
    );

    console.log('controller response:', response);

    return response;
  }

  @Post('create-tax-law-part-in-chapter-by-chapter-id/:chapterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law part created successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create tax law part in a chapter.',
    description:
      'This is the endpoint for creating tax law part in chapter using chapterId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law part created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create tax law part.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createPartByChapterId(
    @Param('chapterId') chapterId: string,
    @Body(new NormalizeDtoPipe()) createPartDto: CreatePartDto,
  ) {
    console.log('controller createPartDto:', createPartDto);
    const response = await this.taxLawsService.createPartByChapterId(
      chapterId,
      createPartDto,
    );

    console.log('controller response:', response);

    return response;
  }

  @Post('create-tax-law-chapter-in-taxlaw-by-taxlaw-id/:taxLawId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law chapter created successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create tax law chapter in a section.',
    description:
      'This is the endpoint for creating tax law chapter in tax law using taxLawId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law chapter created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create tax law chapter.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createChapterUsingTaxLawId(
    @Param('taxLawId') taxLawId: string,
    @Body(new NormalizeDtoPipe()) createChapterDto: CreateChapterDto,
  ) {
    console.log('controller createChapterDto:', createChapterDto);
    const response = await this.taxLawsService.createChapterUsingTaxLawId(
      taxLawId,
      createChapterDto,
    );

    console.log('controller response:', response);

    return response;
  }

  @Post('create-tax-law-schedule-in-taxlaw-by-taxlaw-id/:taxLawId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Tax law schedule created successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create tax law schedule in a tax law.',
    description:
      'This is the endpoint for creating tax law schedule in taxlaw using taxLawId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax law schedule created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create tax law schedule.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createScheduleUsingTaxLawId(
    @Param('taxLawId') taxLawId: string,
    @Body(new NormalizeDtoPipe()) createScheduleDto: CreateScheduleDto,
  ) {
    console.log('controller createScheduleDto:', createScheduleDto);
    const response = await this.taxLawsService.createScheduleUsingTaxLawId(
      taxLawId,
      createScheduleDto,
    );

    console.log('controller response:', response);

    return response;
  }
}
