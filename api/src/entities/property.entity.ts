import { Entity, Enum, Index, ManyToOne, PrimaryKey, Property as Column, OptionalProps, Unique } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { Agency } from './agency.entity';

export const PROPERTY_TYPES = ['apartment', 'villa', 'townhouse', 'penthouse'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = ['available', 'reserved', 'sold'] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

/** A listing for sale. Every listing belongs to one agency. */
@Entity({ tableName: 'properties' })
@Index({ properties: ['agency', 'area'] })
@Index({ properties: ['agency', 'status', 'priceAed'] })
@Unique({ properties: ['agency', 'reference'] })
export class Property {
  [OptionalProps]?: 'status' | 'listedAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne({ entity: () => Agency })
  agency!: Agency;

  /** The agency's own listing code, e.g. "MBR-1001". Unique within the agency. */
  @Column({ type: 'string' })
  reference!: string;

  @Column({ type: 'string' })
  title!: string;

  /** Community, e.g. "Dubai Marina", "Jumeirah Lake Towers". */
  @Column({ type: 'string' })
  area!: string;

  @Column({ type: 'string', nullable: true })
  building?: string | null;

  @Enum({ items: [...PROPERTY_TYPES] })
  type!: PropertyType;

  /** 0 means studio. */
  @Column({ type: 'integer' })
  bedrooms!: number;

  @Column({ type: 'integer' })
  bathrooms!: number;

  @Column({ type: 'integer' })
  sizeSqft!: number;

  /** Asking price in AED. */
  @Column({ type: 'integer' })
  priceAed!: number;

  /** Estimated yearly rent in AED if the unit were let; null when unknown. */
  @Column({ type: 'integer', nullable: true })
  annualRentAed?: number | null;

  @Column({ type: 'double', nullable: true })
  serviceChargeAedPerSqft?: number | null;

  @Enum({ items: [...PROPERTY_STATUSES] })
  status: PropertyStatus = 'available';

  /** Free text written by whoever listed the property. */
  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'datetime', columnType: 'timestamptz' })
  listedAt: Date = new Date();
}
