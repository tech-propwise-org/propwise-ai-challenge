import { Entity, Enum, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { PROPERTY_TYPES, PropertyType } from './property.entity';

/**
 * A recorded sale in Dubai, from the land department's public transaction feed. Market data: it belongs to no
 * agency, and every agency sees all of it. Like listings, it was typed in by people.
 */
@Entity({ tableName: 'sales' })
@Index({ properties: ['area', 'type', 'bedrooms', 'soldAt'] })
export class Sale {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'string' })
  area!: string;

  @Property({ type: 'string', nullable: true })
  building?: string | null;

  @Enum({ items: [...PROPERTY_TYPES] })
  type!: PropertyType;

  /** 0 means studio. */
  @Property({ type: 'integer' })
  bedrooms!: number;

  @Property({ type: 'integer' })
  sizeSqft!: number;

  @Property({ type: 'integer' })
  priceAed!: number;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  soldAt!: Date;
}
