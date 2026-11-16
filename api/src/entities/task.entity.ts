import { Entity, Enum, Index, ManyToOne, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { Agency } from './agency.entity';
import { Agent } from './agent.entity';
import { Lead } from './lead.entity';

export const TASK_STATUSES = ['open', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** A to-do for an agent about a lead, e.g. "Call Karim about Marina Gate". */
@Entity({ tableName: 'tasks' })
@Index({ properties: ['lead', 'dueAt'] })
export class Task {
  [OptionalProps]?: 'status' | 'createdAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne({ entity: () => Agency })
  agency!: Agency;

  @ManyToOne({ entity: () => Lead })
  lead!: Lead;

  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'text', nullable: true })
  notes?: string | null;

  @Property({ type: 'datetime', columnType: 'timestamptz', nullable: true })
  dueAt?: Date | null;

  @Enum({ items: [...TASK_STATUSES] })
  status: TaskStatus = 'open';

  @ManyToOne({ entity: () => Agent })
  createdBy!: Agent;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  createdAt: Date = new Date();
}
