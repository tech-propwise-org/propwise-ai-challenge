import { Entity, ManyToOne, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { Agency } from './agency.entity';

/** A real estate agent: the person who logs in to the CRM. */
@Entity({ tableName: 'agents' })
export class Agent {
  [OptionalProps]?: 'timezone' | 'createdAt' | 'areas' | 'languages' | 'onLeave';

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

  /** Areas the agent covers, named as in the listings, e.g. ["Dubai Marina", "Jumeirah Lake Towers"]. */
  @Property({ type: 'json', default: '[]' })
  areas: string[] = [];

  /** Languages the agent works in: "en", "ar". */
  @Property({ type: 'json', default: '["en"]' })
  languages: string[] = ['en'];

  /** On leave: takes no new leads. */
  @Property({ type: 'boolean', default: false })
  onLeave: boolean = false;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  createdAt: Date = new Date();
}
