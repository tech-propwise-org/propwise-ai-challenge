import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsISO8601, IsOptional, IsString, Length, Matches, Max, MaxLength, Min } from 'class-validator';
import { DATE_TIME_WITH_OFFSET, DATE_TIME_WITH_OFFSET_MESSAGE, MAX_INT } from '../common/validation';
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  LeadSource,
  LeadStatus,
  MESSAGE_CHANNELS,
  MESSAGE_DIRECTIONS,
  MessageChannel,
  MessageDirection,
} from '../entities';

export class ListLeadsQuery {
  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: LeadStatus;

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

export class CreateLeadDto {
  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsIn(LEAD_SOURCES)
  source!: LeadSource;

  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}

/** Records a message, as the WhatsApp or email integration would when one arrives or is sent. */
export class CreateMessageDto {
  @IsIn(MESSAGE_DIRECTIONS)
  direction!: MessageDirection;

  @IsIn(MESSAGE_CHANNELS)
  channel!: MessageChannel;

  @IsString()
  @Length(1, 10000)
  body!: string;

  /** When the message was sent, with Z or an offset. Defaults to now. */
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(DATE_TIME_WITH_OFFSET, { message: DATE_TIME_WITH_OFFSET_MESSAGE })
  sentAt?: string;
}
