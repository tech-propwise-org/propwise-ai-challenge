import { Controller, Get, Query } from '@nestjs/common';
import { SearchSalesQuery } from './market.dto';
import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  /** Sales recorded in Dubai (any logged-in agent): filter by area, type, bedrooms and when they sold. */
  @Get('sales')
  searchSales(@Query() query: SearchSalesQuery) {
    return this.market.searchSales(query);
  }
}
