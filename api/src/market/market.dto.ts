import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { DATE_TIME_WITH_OFFSET, DATE_TIME_WITH_OFFSET_MESSAGE, MAX_INT } from '../common/validation';
import { PROPERTY_TYPES, PropertyType } from '../entities';

export class SearchSalesQuery {
  /** Exact community name, any case: "dubai marina". */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  type?: PropertyType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  bedrooms?: number;

  /** Sales on or after this time, with Z or an offset. */
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(DATE_TIME_WITH_OFFSET, { message: DATE_TIME_WITH_OFFSET_MESSAGE })
  soldAfter?: string;

  /** Sales before this time, with Z or an offset. */
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(DATE_TIME_WITH_OFFSET, { message: DATE_TIME_WITH_OFFSET_MESSAGE })
  soldBefore?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  offset?: number;
}
