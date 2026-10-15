import { Entity, Enum, Index, ManyToOne, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { Lead } from './lead.entity';

export const MESSAGE_DIRECTIONS = ['inbound', 'outbound'] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_CHANNELS = ['whatsapp', 'email', 'sms'] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

/** One message in the conversation with a lead. Inbound = from the lead, outbound = from the agent. */
@Entity({ tableName: 'messages' })
@Index({ properties: ['lead', 'sentAt'] })
export class Message {
  [OptionalProps]?: 'sentAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne({ entity: () => Lead })
  lead!: Lead;

  @Enum({ items: [...MESSAGE_DIRECTIONS] })
  direction!: MessageDirection;

  @Enum({ items: [...MESSAGE_CHANNELS] })
  channel!: MessageChannel;

  @Property({ type: 'text' })
  body!: string;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  sentAt: Date = new Date();
}
