import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { AuthAgent, CurrentAgent } from '../auth/decorators';
import { CreatePropertyDto, SearchPropertiesQuery } from './properties.dto';
import { PropertiesService } from './properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  search(@CurrentAgent() agent: AuthAgent, @Query() query: SearchPropertiesQuery) {
    return this.properties.search(agent.agencyId, query);
  }

  @Get(':id')
  get(@CurrentAgent() agent: AuthAgent, @Param('id', ParseUUIDPipe) id: string) {
    return this.properties.get(agent.agencyId, id);
  }

  @Post()
  create(@CurrentAgent() agent: AuthAgent, @Body() dto: CreatePropertyDto) {
    return this.properties.create(agent.agencyId, dto);
  }
}
