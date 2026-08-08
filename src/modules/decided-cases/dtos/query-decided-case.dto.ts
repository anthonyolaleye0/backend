import { IsOptional, IsString } from 'class-validator';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';

export class QueryDecidedCasesDto extends QueryWithPaginationDto {
  @IsOptional()
  @IsString()
  court?: string;
}
