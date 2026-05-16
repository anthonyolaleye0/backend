import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({
    description: 'Section title',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Section content',
  })
  @IsString()
  content!: string;

  @ApiProperty({
    description: 'Section number',
  })
  @IsString()
  number!: string;
}
