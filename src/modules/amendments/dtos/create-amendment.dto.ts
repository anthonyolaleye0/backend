import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum TargetLevel {
  TAXLAW = 'TAXLAW',
  CHAPTER = 'CHAPTER',
  PART = 'PART',
  SECTION = 'SECTION',
  SUBSECTION = 'SUBSECTION',
}

export enum AmendmentType {
  INSERT = 'INSERT',
  DELETE = 'DELETE',
  MODIFY = 'MODIFY',
}

export class TargetDto {
  @ApiProperty({
    description: 'Level of the entity being amended',
    enum: TargetLevel,
    example: TargetLevel.SECTION,
  })
  @IsEnum(TargetLevel)
  level!: TargetLevel;

  @ApiProperty({
    description: 'MongoDB ObjectId of the target entity',
    example: '665f1c2a9f1b2c0012345678',
  })
  @IsMongoId()
  entityId!: string;

  @ApiProperty({
    description: 'Optional structured path for identifying location within law',
    required: false,
    example: {
      chapterNumber: 2,
      partNumber: 5,
      sectionNumber: 15,
      subSectionNumber: 3,
    },
  })
  @IsOptional()
  path?: {
    chapterNumber?: number;
    partNumber?: number;
    sectionNumber?: number;
    subSectionNumber?: number;
  };
}

export class CreateAmendmentDto {
  @ApiProperty({
    description: 'Target entity where amendment applies',
    type: TargetDto,
  })
  @ValidateNested()
  @Type(() => TargetDto)
  target!: TargetDto;

  @ApiProperty({
    description: 'Type of amendment operation',
    enum: AmendmentType,
  })
  @IsEnum(AmendmentType)
  type!: AmendmentType;

  @ApiProperty({
    description: 'Fields to be updated',
    example: {
      title: 'Updated Section Title',
      content: 'Updated content...',
    },
  })
  @IsOptional()
  changes?: {
    title?: string;
    content?: string;
  };

  @ApiProperty({
    description: 'Date the amendment becomes effective',
    example: '2024-01-01',
  })
  @IsDateString()
  effectiveDate!: string;

  @ApiPropertyOptional({
    description: 'Explanation of why this amendment exists',
  })
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata about the amendment',
    required: false,
    example: {
      act: 'Finance Act 2024',
      year: 2024,
    },
  })
  @IsOptional()
  metadata?: {
    financeAct?: string;
    year?: number;
  };
}

// export class CreateAmendmentDto {
//   @ApiProperty({
//     description: 'Target entity where amendment applies',
//     type: TargetDto,
//     example: {
//       level: 'SECTION',
//       entityId: '665f1c2a9f1b2c0012345678',
//       path: {
//         chapterNumber: 2,
//         sectionNumber: 15,
//       },
//     },
//   })
//   @ValidateNested()
//   @Type(() => TargetDto)
//   target!: TargetDto;

//   @ApiProperty({
//     description: 'Type of amendment operation',
//     enum: AmendmentType,
//     example: AmendmentType.MODIFY,
//   })
//   @IsEnum(AmendmentType)
//   type!: AmendmentType;

//   @ApiProperty({
//     description: 'New content to apply (used in INSERT or MODIFY)',
//     example: 'All companies must file tax returns before March 31st.',
//   })
//   @IsString()
//   content!: string;

//   @ApiProperty({
//     description: 'Date the amendment becomes effective',
//     example: '2024-01-01',
//   })
//   @IsDateString()
//   effectiveDate!: string;

//   @ApiProperty({
//     description: 'Explanation of why this amendment exists',
//     example: 'Updated filing deadline under Finance Act 2024',
//   })
//   @IsString()
//   description!: string;

// @ApiProperty({
//   description: 'Additional metadata about the amendment',
//   required: false,
//   example: {
//     financeAct: 'Finance Act 2024',
//     year: 2024,
//   },
// })
//   @IsOptional()
//   metadata?: {
//     financeAct?: string;
//     year?: number;
//   };
// }
