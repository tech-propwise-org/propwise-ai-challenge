import { Entity, Enum, Index, ManyToOne, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { Agency } from './agency.entity';
import { Agent } from './agent.entity';

export const LEAD_SOURCES = ['whatsapp', 'website', 'portal', 'referral', 'email'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'viewing', 'negotiating', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

@Entity({ tableName: 'leads' })
@Index({ properties: ['agency', 'updatedAt'] })
export class Lead {
  [OptionalProps]?: 'status' | 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne({ entity: () => Agency })
  agency!: Agency;

  @ManyToOne({ entity: () => Agent, nullable: true })
  assignedAgent?: Agent | null;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string', nullable: true })
  phone?: string | null;

  @Property({ type: 'string', nullable: true })
  email?: string | null;

  @Enum({ items: [...LEAD_SOURCES] })
  source!: LeadSource;

  @Enum({ items: [...LEAD_STATUSES] })
  status: LeadStatus = 'new';

  @Property({ type: 'text', nullable: true })
  notes?: string | null;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', columnType: 'timestamptz', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
