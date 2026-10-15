import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageDto, toLeadDto, toMessageDto } from '../common/dto';
import { Agency, Agent, Lead, Message, MessageChannel, MessageDirection } from '../entities';
import { CreateLeadDto, CreateMessageDto, ListLeadsQuery } from './leads.dto';

const MAX_MESSAGES_PER_LEAD = 200;

interface LastMessageRow {
  id: string;
  lead_id: string;
  direction: MessageDirection;
  channel: MessageChannel;
  body: string;
  sent_at: Date;
}

@Injectable()
export class LeadsService {
  constructor(private readonly em: EntityManager) {}

  async list(agencyId: string, query: ListLeadsQuery) {
    const [leads, total] = await this.em.findAndCount(
      Lead,
      { agency: agencyId, ...(query.status ? { status: query.status } : {}) },
      {
        populate: ['assignedAgent'],
        orderBy: { updatedAt: 'desc', id: 'asc' },
        limit: query.limit ?? 20,
        offset: query.offset ?? 0,
      },
    );

    const lastMessages = new Map<string, MessageDto>();
    if (leads.length > 0) {
      const rows = await this.em.getConnection().execute<LastMessageRow[]>(
        `select distinct on (lead_id) id, lead_id, direction, channel, body, sent_at
           from messages
          where lead_id in (?)
          order by lead_id, sent_at desc`,
        [leads.map((lead) => lead.id)],
      );
      for (const row of rows) {
        lastMessages.set(row.lead_id, {
          id: row.id,
          leadId: row.lead_id,
          direction: row.direction,
          channel: row.channel,
          body: row.body,
          sentAt: new Date(row.sent_at).toISOString(),
        });
      }
    }

    return {
      items: leads.map((lead) => ({ ...toLeadDto(lead), lastMessage: lastMessages.get(lead.id) ?? null })),
      total,
    };
  }

  /** The newest messages (up to 200), oldest first, and how many the lead has in total. */
  async get(agencyId: string, leadId: string) {
    const lead = await this.findLead(agencyId, leadId);
    const [newestFirst, messageCount] = await this.em.findAndCount(
      Message,
      { lead },
      { orderBy: { sentAt: 'desc', id: 'desc' }, limit: MAX_MESSAGES_PER_LEAD },
    );
    return { ...toLeadDto(lead), messageCount, messages: newestFirst.reverse().map(toMessageDto) };
  }

  async create(agencyId: string, agentId: string, dto: CreateLeadDto) {
    const lead = this.em.create(Lead, {
      agency: this.em.getReference(Agency, agencyId),
      assignedAgent: this.em.getReference(Agent, agentId),
      name: dto.name,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      source: dto.source,
      status: dto.status ?? 'new',
      notes: dto.notes ?? null,
    });
    await this.em.flush();
    await this.em.populate(lead, ['assignedAgent']);
    return toLeadDto(lead);
  }

  async addMessage(agencyId: string, leadId: string, dto: CreateMessageDto) {
    const lead = await this.findLead(agencyId, leadId);
    const message = this.em.create(Message, {
      lead,
      direction: dto.direction,
      channel: dto.channel,
      body: dto.body,
      sentAt: dto.sentAt ? new Date(dto.sentAt) : new Date(),
    });
    lead.updatedAt = new Date();
    await this.em.flush();
    return toMessageDto(message);
  }

  /** Loads a lead only if it belongs to the agency; anything else is a 404, never a 403, so ids don't leak. */
  async findLead(agencyId: string, leadId: string): Promise<Lead> {
    const lead = await this.em.findOne(Lead, { id: leadId, agency: agencyId }, { populate: ['assignedAgent'] });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }
}
