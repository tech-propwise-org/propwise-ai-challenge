import { IsIn, IsISO8601, IsOptional, IsString, Length, Matches, MaxLength, ValidateIf } from 'class-validator';
import { DATE_TIME_WITH_OFFSET, DATE_TIME_WITH_OFFSET_MESSAGE } from '../common/validation';
import { TASK_STATUSES, TaskStatus } from '../entities';

export class CreateTaskDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  /** ISO 8601 with an offset, e.g. "2026-10-16T10:00:00+04:00". */
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(DATE_TIME_WITH_OFFSET, { message: DATE_TIME_WITH_OFFSET_MESSAGE })
  dueAt?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  /** Send null to clear the due date. */
  @IsOptional()
  @ValidateIf((_dto, value) => value !== null)
  @IsISO8601({ strict: true })
  @Matches(DATE_TIME_WITH_OFFSET, { message: DATE_TIME_WITH_OFFSET_MESSAGE })
  dueAt?: string | null;
}
