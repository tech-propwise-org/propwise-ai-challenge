import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { MAX_INT } from '../common/validation';
import { PROPERTY_STATUSES, PROPERTY_TYPES, PropertyStatus, PropertyType } from '../entities';

export class SearchPropertiesQuery {
  /** Exact community name, any case: "dubai marina". */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  /** Free text matched against title, area and building. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  type?: PropertyType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minBedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  maxBedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  minPriceAed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  maxPriceAed?: number;

  @IsOptional()
  @IsIn(PROPERTY_STATUSES)
  status?: PropertyStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  offset?: number;
}

export class CreatePropertyDto {
  @IsString()
  @Length(1, 50)
  reference!: string;

  @IsString()
  @Length(1, 200)
  title!: string;

  @IsString()
  @Length(1, 100)
  area!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  building?: string;

  @IsIn(PROPERTY_TYPES)
  type!: PropertyType;

  @IsInt()
  @Min(0)
  @Max(20)
  bedrooms!: number;

  @IsInt()
  @Min(0)
  @Max(20)
  bathrooms!: number;

  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  sizeSqft!: number;

  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  priceAed!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  annualRentAed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceChargeAedPerSqft?: number;

  @IsOptional()
  @IsIn(PROPERTY_STATUSES)
  status?: PropertyStatus;

  @IsString()
  @Length(1, 5000)
  description!: string;
}
