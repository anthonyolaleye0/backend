import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePartDto {
  @ApiProperty({
    description: 'Part title',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Part number',
  })
  @IsString()
  number!: string;
}
