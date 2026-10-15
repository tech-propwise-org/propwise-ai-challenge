import type { Agent, Lead, Message, Property, Task } from '../entities';

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
