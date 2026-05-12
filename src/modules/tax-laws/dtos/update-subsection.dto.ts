import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateSubSectionDto {
  @ApiProperty({
    description: 'Sub section number',
    example: '1',
  })
  @IsString({ message: 'Number is a string' })
  number!: string;

  @ApiProperty({
    description: 'Sub section content',
    example:
      'ORDER 2021, TO AMEND THE COMPANIES INCOME TAX (SIGNIFICANT ECONOMIC PRESENCE) ORDER, 2020 AND THE PETROLEUM (DRILLING AND PRODUCTION) REGULATIONS 1969, TO CONSOLIDATE THE LEGAL FRAMEWORKS RELATING TO TAXATION AND ENACT THE NIGERIA TAX ACT TO PROVIDE FOR TAXATION OF INCOME, TRANSACTIONS AND INSTRUMENTS; AND FOR RELATED MATTERS.',
  })
  @IsString({ message: 'Content is a string' })
  content!: string;
}
