import { FilterQuery, UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { toPropertyDto } from '../common/dto';
import { Agency, Property } from '../entities';
import { CreatePropertyDto, SearchPropertiesQuery } from './properties.dto';

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function range(min?: number, max?: number) {
  if (min === undefined && max === undefined) return undefined;
  return { ...(min !== undefined ? { $gte: min } : {}), ...(max !== undefined ? { $lte: max } : {}) };
}

@Injectable()
export class PropertiesService {
  constructor(private readonly em: EntityManager) {}

  async search(agencyId: string, query: SearchPropertiesQuery) {
    const where: FilterQuery<Property> = { agency: agencyId };
    if (query.area) where.area = { $ilike: escapeLike(query.area.trim()) };
    if (query.q) {
      const pattern = `%${escapeLike(query.q.trim())}%`;
      where.$or = [{ title: { $ilike: pattern } }, { area: { $ilike: pattern } }, { building: { $ilike: pattern } }];
    }
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    const bedrooms = range(query.minBedrooms, query.maxBedrooms);
    if (bedrooms) where.bedrooms = bedrooms;
    const price = range(query.minPriceAed, query.maxPriceAed);
    if (price) where.priceAed = price;

    const [items, total] = await this.em.findAndCount(Property, where, {
      orderBy: { priceAed: 'asc', id: 'asc' },
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    });
    return { items: items.map(toPropertyDto), total };
  }

  async get(agencyId: string, propertyId: string) {
    const property = await this.em.findOne(Property, { id: propertyId, agency: agencyId });
    if (!property) throw new NotFoundException('Property not found');
    return toPropertyDto(property);
  }

  async create(agencyId: string, dto: CreatePropertyDto) {
    const property = this.em.create(Property, {
      agency: this.em.getReference(Agency, agencyId),
      reference: dto.reference,
      title: dto.title,
      area: dto.area,
      building: dto.building ?? null,
      type: dto.type,
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      sizeSqft: dto.sizeSqft,
      priceAed: dto.priceAed,
      annualRentAed: dto.annualRentAed ?? null,
      serviceChargeAedPerSqft: dto.serviceChargeAedPerSqft ?? null,
      status: dto.status ?? 'available',
      description: dto.description,
    });
    try {
      await this.em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(`Your agency already has a listing with reference ${dto.reference}`);
      }
      throw error;
    }
    return toPropertyDto(property);
  }
}
