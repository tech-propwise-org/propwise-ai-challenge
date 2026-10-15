import { Entity, ManyToOne, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { Agency } from './agency.entity';

/** A real estate agent: the person who logs in to the CRM. */
@Entity({ tableName: 'agents' })
export class Agent {
  [OptionalProps]?: 'timezone' | 'createdAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne({ entity: () => Agency })
  agency!: Agency;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string', unique: true })
  email!: string;

  @Property({ type: 'string', hidden: true })
  passwordHash!: string;

  /** IANA timezone the agent works in, e.g. "Asia/Dubai". */
  @Property({ type: 'string' })
  timezone: string = 'Asia/Dubai';

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  createdAt: Date = new Date();
}
