import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateScheduleDto {
  @ApiProperty({
    description: 'Schedule title',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Schedule content',
  })
  @IsString()
  content!: string;

  @ApiProperty({
    description: 'Schedule number',
  })
  @IsString()
  number!: string;
}
