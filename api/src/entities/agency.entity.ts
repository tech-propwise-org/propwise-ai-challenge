import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';

@Entity({ tableName: 'agencies' })
export class Agency {
  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  createdAt: Date = new Date();
}
