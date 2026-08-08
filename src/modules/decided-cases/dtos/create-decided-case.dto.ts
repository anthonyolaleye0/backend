import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDecidedCaseDto {
  @IsString()
  @IsNotEmpty()
  suitNumber!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  @IsNotEmpty()
  judgmentDate!: string;

  @IsOptional()
  @IsString()
  court?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map((k: string) => k.trim());
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [value];
      }
    }
    return value;
  })
  @IsArray()
  @IsMongoId({ each: true })
  relatedTaxLaws?: string[];
}
