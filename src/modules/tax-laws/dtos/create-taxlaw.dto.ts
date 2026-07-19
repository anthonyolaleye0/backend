import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTaxLawDto {
  @ApiProperty({
    description: 'This is the title of the tax law.',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  description?: string;
}
