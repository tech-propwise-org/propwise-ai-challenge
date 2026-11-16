import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { AuthAgent, CurrentAgent } from '../auth/decorators';
import { CreatePropertyDto, SearchPropertiesQuery, UpdatePropertyStatusDto } from './properties.dto';
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

  @Patch(':id')
  updateStatus(
    @CurrentAgent() agent: AuthAgent,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyStatusDto,
  ) {
    return this.properties.updateStatus(agent.agencyId, id, dto);
  }
}
