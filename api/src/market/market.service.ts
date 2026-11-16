import { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { toSaleDto } from '../common/dto';
import { Sale } from '../entities';
import { SearchSalesQuery } from './market.dto';

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

@Injectable()
export class MarketService {
  constructor(private readonly em: EntityManager) {}

  /** Recorded sales, newest first. Market data: the same for every agency. */
  async searchSales(query: SearchSalesQuery) {
    const where: FilterQuery<Sale> = {};
    if (query.area) where.area = { $ilike: escapeLike(query.area.trim()) };
    if (query.type) where.type = query.type;
    if (query.bedrooms !== undefined) where.bedrooms = query.bedrooms;
    if (query.soldAfter || query.soldBefore) {
      where.soldAt = {
        ...(query.soldAfter ? { $gte: new Date(query.soldAfter) } : {}),
        ...(query.soldBefore ? { $lt: new Date(query.soldBefore) } : {}),
      };
    }
    const [items, total] = await this.em.findAndCount(Sale, where, {
      orderBy: { soldAt: 'desc', id: 'asc' },
      limit: query.limit ?? 100,
      offset: query.offset ?? 0,
    });
    return { items: items.map(toSaleDto), total };
  }
}
