import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';

export class QueryUserTipsDto extends QueryWithPaginationDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  unreadOnly?: boolean;
}
