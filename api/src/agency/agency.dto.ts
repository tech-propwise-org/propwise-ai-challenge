import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export const LANGUAGES = ['en', 'ar'] as const;

export class UpdateAgencyDto {
  /** In a real CRM only an admin could change this. Here any agent of the agency can, to try things out. */
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100_000)
  aiMonthlyBudgetUsd!: number;
}

export class UpdateAgentDto {
  @IsOptional()
  @IsBoolean()
  onLeave?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Length(1, 100, { each: true })
  areas?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(LANGUAGES.length)
  @IsIn(LANGUAGES, { each: true })
  languages?: string[];
}
