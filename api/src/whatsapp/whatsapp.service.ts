import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Agency, Lead, Message } from '../entities';
import { WhatsAppMessageDto } from './whatsapp.dto';

/** "+971 50 123 4567" and "971501234567" are the same number. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

@Injectable()
export class WhatsAppService {
  constructor(private readonly em: EntityManager) {}

  /** Saves one incoming message on the sender's lead, creating the lead (unassigned) the first time they write. */
  async receive(dto: WhatsAppMessageDto) {
    const agency = await this.findAgency(dto.to);
    const lead = (await this.findLead(agency.id, dto.from)) ?? this.newLead(agency, dto);
    const message = this.em.create(Message, {
      lead,
      direction: 'inbound',
      channel: 'whatsapp',
      body: dto.text,
      sentAt: new Date(dto.timestamp),
      externalId: dto.messageId,
    });
    lead.updatedAt = new Date();
    await this.em.flush();
    return { received: true, leadId: lead.id, messageId: message.id };
  }

  private async findAgency(to: string): Promise<Agency> {
    const rows = await this.em.getConnection().execute<{ id: string }[]>(
      `select id from agencies where regexp_replace(coalesce(whatsapp_number, ''), '\\D', '', 'g') = ?`,
      [phoneDigits(to)],
    );
    if (rows.length === 0) throw new NotFoundException('No agency uses this WhatsApp number');
    return this.em.findOneOrFail(Agency, rows[0].id);
  }

  private async findLead(agencyId: string, from: string): Promise<Lead | null> {
    const rows = await this.em.getConnection().execute<{ id: string }[]>(
      `select id from leads
        where agency_id = ? and regexp_replace(coalesce(phone, ''), '\\D', '', 'g') = ?
        order by created_at, id
        limit 1`,
      [agencyId, phoneDigits(from)],
    );
    return rows.length ? this.em.findOneOrFail(Lead, rows[0].id) : null;
  }

  private newLead(agency: Agency, dto: WhatsAppMessageDto): Lead {
    return this.em.create(Lead, {
      agency,
      assignedAgent: null,
      name: dto.profileName ?? dto.from,
      phone: dto.from,
      email: null,
      source: 'whatsapp',
      status: 'new',
      notes: null,
    });
  }
}
