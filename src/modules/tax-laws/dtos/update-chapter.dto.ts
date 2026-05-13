import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateChapterDto {
  @ApiProperty({
    description: 'Chapter title',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Chapter number',
  })
  @IsString()
  number!: string;
}
