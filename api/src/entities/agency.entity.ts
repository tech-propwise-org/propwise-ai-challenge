import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';

@Entity({ tableName: 'agencies' })
export class Agency {
  [OptionalProps]?: 'createdAt' | 'whatsappNumber' | 'aiMonthlyBudgetUsd' | 'aiSpentUsd';

  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'string' })
  name!: string;

  /** The agency's WhatsApp business number, e.g. "+971 4 555 0101". The webhook's `to` is matched against it. */
  @Property({ type: 'string', nullable: true, unique: true })
  whatsappNumber?: string | null;

  /** What the agency allows the AI assistant to spend this month, in USD. Decimal columns come back as strings. */
  @Property({ type: 'decimal', precision: 12, scale: 4, default: '0' })
  aiMonthlyBudgetUsd: string = '0';

  /** What the AI assistant has spent this month, in USD. */
  @Property({ type: 'decimal', precision: 12, scale: 4, default: '0' })
  aiSpentUsd: string = '0';

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  createdAt: Date = new Date();
}
