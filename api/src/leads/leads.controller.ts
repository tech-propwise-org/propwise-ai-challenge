import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { AuthAgent, CurrentAgent } from '../auth/decorators';
import { CreateLeadDto, CreateMessageDto, ListLeadsQuery } from './leads.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@CurrentAgent() agent: AuthAgent, @Query() query: ListLeadsQuery) {
    return this.leads.list(agent.agencyId, query);
  }

  @Get(':id')
  get(@CurrentAgent() agent: AuthAgent, @Param('id', ParseUUIDPipe) id: string) {
    return this.leads.get(agent.agencyId, id);
  }

  @Post()
  create(@CurrentAgent() agent: AuthAgent, @Body() dto: CreateLeadDto) {
    return this.leads.create(agent.agencyId, agent.id, dto);
  }

  @Post(':id/messages')
  addMessage(
    @CurrentAgent() agent: AuthAgent,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.leads.addMessage(agent.agencyId, id, dto);
  }
}
