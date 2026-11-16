import type { Agency, Agent, Lead, Message, Property, Sale, Task } from '../entities';

// Response shapes. The web and mobile apps rely on these: change them only on purpose.

export function toAgentDto(agent: Agent) {
  return {
    id: agent.id,
    name: agent.name,
    email: agent.email,
    timezone: agent.timezone,
    agency: { id: agent.agency.id, name: agent.agency.name },
  };
}

export function toMessageDto(message: Message) {
  return {
    id: message.id,
    leadId: message.lead.id,
    direction: message.direction,
    channel: message.channel,
    body: message.body,
    sentAt: message.sentAt.toISOString(),
    externalId: message.externalId ?? null,
  };
}
export type MessageDto = ReturnType<typeof toMessageDto>;

export function toLeadDto(lead: Lead) {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone ?? null,
    email: lead.email ?? null,
    source: lead.source,
    status: lead.status,
    notes: lead.notes ?? null,
    assignedAgent: lead.assignedAgent ? { id: lead.assignedAgent.id, name: lead.assignedAgent.name } : null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export function toPropertyDto(property: Property) {
  return {
    id: property.id,
    reference: property.reference,
    title: property.title,
    area: property.area,
    building: property.building ?? null,
    type: property.type,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sizeSqft: property.sizeSqft,
    priceAed: property.priceAed,
    annualRentAed: property.annualRentAed ?? null,
    serviceChargeAedPerSqft: property.serviceChargeAedPerSqft ?? null,
    status: property.status,
    description: property.description,
    listedAt: property.listedAt.toISOString(),
  };
}

/** An agent as the team list shows them: what they cover, and how many open leads they have. */
export function toAgentProfileDto(agent: Agent, openLeads: number) {
  return {
    id: agent.id,
    name: agent.name,
    email: agent.email,
    timezone: agent.timezone,
    areas: agent.areas,
    languages: agent.languages,
    onLeave: agent.onLeave,
    /** Leads assigned to the agent whose status is not "won" or "lost". */
    openLeads,
  };
}

export function toAgencyDto(agency: Agency) {
  return {
    id: agency.id,
    name: agency.name,
    whatsappNumber: agency.whatsappNumber ?? null,
    aiMonthlyBudgetUsd: Number(agency.aiMonthlyBudgetUsd),
    aiSpentUsd: Number(agency.aiSpentUsd),
  };
}

export function toSaleDto(sale: Sale) {
  return {
    id: sale.id,
    area: sale.area,
    building: sale.building ?? null,
    type: sale.type,
    bedrooms: sale.bedrooms,
    sizeSqft: sale.sizeSqft,
    priceAed: sale.priceAed,
    soldAt: sale.soldAt.toISOString(),
  };
}

export function toTaskDto(task: Task) {
  return {
    id: task.id,
    leadId: task.lead.id,
    title: task.title,
    notes: task.notes ?? null,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    status: task.status,
    createdBy: { id: task.createdBy.id, name: task.createdBy.name },
    createdAt: task.createdAt.toISOString(),
  };
}
