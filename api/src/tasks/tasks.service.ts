import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { toTaskDto } from '../common/dto';
import { Agency, Agent, Task } from '../entities';
import { LeadsService } from '../leads/leads.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';

const MAX_TASKS_PER_LEAD = 100;

@Injectable()
export class TasksService {
  constructor(
    private readonly em: EntityManager,
    private readonly leads: LeadsService,
  ) {}

  async listForLead(agencyId: string, leadId: string) {
    const lead = await this.leads.findLead(agencyId, leadId);
    const [tasks, total] = await this.em.findAndCount(
      Task,
      { lead },
      {
        populate: ['createdBy'],
        orderBy: { dueAt: 'asc nulls last', createdAt: 'asc', id: 'asc' },
        limit: MAX_TASKS_PER_LEAD,
      },
    );
    return { items: tasks.map(toTaskDto), total };
  }

  async create(agencyId: string, agentId: string, leadId: string, dto: CreateTaskDto) {
    const lead = await this.leads.findLead(agencyId, leadId);
    const task = this.em.create(Task, {
      agency: this.em.getReference(Agency, agencyId),
      lead,
      title: dto.title,
      notes: dto.notes ?? null,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      status: 'open',
      createdBy: this.em.getReference(Agent, agentId),
    });
    await this.em.flush();
    await this.em.populate(task, ['createdBy']);
    return toTaskDto(task);
  }

  async update(agencyId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.em.findOne(Task, { id: taskId, agency: agencyId }, { populate: ['createdBy'] });
    if (!task) throw new NotFoundException('Task not found');
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.notes !== undefined) task.notes = dto.notes;
    if (dto.dueAt !== undefined) task.dueAt = dto.dueAt === null ? null : new Date(dto.dueAt);
    await this.em.flush();
    return toTaskDto(task);
  }
}
