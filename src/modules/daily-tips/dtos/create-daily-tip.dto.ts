import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDailyTipDto {
  @IsMongoId()
  @IsNotEmpty()
  sectionId!: string;

  @IsOptional()
  @IsMongoId()
  subSectionId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
