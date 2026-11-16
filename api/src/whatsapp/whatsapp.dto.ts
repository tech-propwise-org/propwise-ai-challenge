import { IsISO8601, IsOptional, IsString, Length, Matches } from 'class-validator';
import { DATE_TIME_WITH_OFFSET, DATE_TIME_WITH_OFFSET_MESSAGE } from '../common/validation';

/** A phone number with at least 6 digits, whatever the spacing: leads are matched on the digits alone. */
const PHONE = /^\D*(\d\D*){6,}$/;
const PHONE_MESSAGE = '$property must be a phone number with at least 6 digits';

/** One incoming WhatsApp message, as our (fake) WhatsApp provider posts it. */
export class WhatsAppMessageDto {
  /** The provider's id for this message. The provider retries when we answer slowly or fail, with the same id. */
  @IsString()
  @Length(1, 200)
  messageId!: string;

  /** The sender's phone number, e.g. "+971 50 123 4567". */
  @IsString()
  @Length(6, 50)
  @Matches(PHONE, { message: PHONE_MESSAGE })
  from!: string;

  /** The agency's WhatsApp number the message was sent to. */
  @IsString()
  @Length(6, 50)
  @Matches(PHONE, { message: PHONE_MESSAGE })
  to!: string;

  /** The sender's WhatsApp profile name, when they have one. */
  @IsOptional()
  @IsString()
  @Length(1, 200)
  profileName?: string;

  @IsString()
  @Length(1, 4096)
  text!: string;

  /** When the lead sent it, with Z or an offset. */
  @IsISO8601({ strict: true })
  @Matches(DATE_TIME_WITH_OFFSET, { message: DATE_TIME_WITH_OFFSET_MESSAGE })
  timestamp!: string;
}
