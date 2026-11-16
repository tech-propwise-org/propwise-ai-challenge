import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { AuthAgent, CurrentAgent } from '../auth/decorators';
import { UpdateAgencyDto, UpdateAgentDto } from './agency.dto';
import { AgencyService } from './agency.service';

@Controller()
export class AgencyController {
  constructor(private readonly agency: AgencyService) {}

  /** The logged-in agent's agency, with its AI budget and spend this month. */
  @Get('agency')
  getAgency(@CurrentAgent() agent: AuthAgent) {
    return this.agency.getAgency(agent.agencyId);
  }

  @Patch('agency')
  updateAgency(@CurrentAgent() agent: AuthAgent, @Body() dto: UpdateAgencyDto) {
    return this.agency.updateAgency(agent.agencyId, dto);
  }

  @Get('agents')
  listAgents(@CurrentAgent() agent: AuthAgent) {
    return this.agency.listAgents(agent.agencyId);
  }

  @Patch('agents/:id')
  updateAgent(@CurrentAgent() agent: AuthAgent, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAgentDto) {
    return this.agency.updateAgent(agent.agencyId, id, dto);
  }
}
