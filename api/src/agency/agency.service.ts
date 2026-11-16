import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { toAgencyDto, toAgentProfileDto } from '../common/dto';
import { Agency, Agent } from '../entities';
import { UpdateAgencyDto, UpdateAgentDto } from './agency.dto';

@Injectable()
export class AgencyService {
  constructor(private readonly em: EntityManager) {}

  async getAgency(agencyId: string) {
    return toAgencyDto(await this.em.findOneOrFail(Agency, agencyId));
  }

  async updateAgency(agencyId: string, dto: UpdateAgencyDto) {
    const agency = await this.em.findOneOrFail(Agency, agencyId);
    agency.aiMonthlyBudgetUsd = dto.aiMonthlyBudgetUsd.toFixed(4);
    await this.em.flush();
    return toAgencyDto(agency);
  }

  /** The agency's agents, by name, each with their number of open leads. */
  async listAgents(agencyId: string) {
    const agents = await this.em.find(Agent, { agency: agencyId }, { orderBy: { name: 'asc', id: 'asc' } });
    const rows = await this.em.getConnection().execute<{ agent_id: string; open: number }[]>(
      `select assigned_agent_id as agent_id, count(*)::int as open
         from leads
        where agency_id = ? and assigned_agent_id is not null and status not in ('won', 'lost')
        group by assigned_agent_id`,
      [agencyId],
    );
    const open = new Map(rows.map((row) => [row.agent_id, row.open]));
    return agents.map((agent) => toAgentProfileDto(agent, open.get(agent.id) ?? 0));
  }

  async updateAgent(agencyId: string, agentId: string, dto: UpdateAgentDto) {
    const agent = await this.em.findOne(Agent, { id: agentId, agency: agencyId });
    if (!agent) throw new NotFoundException('Agent not found');
    if (dto.onLeave !== undefined) agent.onLeave = dto.onLeave;
    if (dto.areas !== undefined) agent.areas = dto.areas;
    if (dto.languages !== undefined) agent.languages = dto.languages;
    await this.em.flush();
    return (await this.listAgents(agencyId)).find((profile) => profile.id === agent.id)!;
  }
}
