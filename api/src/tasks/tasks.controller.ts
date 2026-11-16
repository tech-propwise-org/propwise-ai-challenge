import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthAgent, CurrentAgent } from '../auth/decorators';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
import { TasksService } from './tasks.service';

@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  /** Up to 100 tasks; the total is in the X-Total-Count header. */
  @Get('leads/:leadId/tasks')
  async list(
    @CurrentAgent() agent: AuthAgent,
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { items, total } = await this.tasks.listForLead(agent.agencyId, leadId);
    response.setHeader('X-Total-Count', String(total));
    return items;
  }

  @Post('leads/:leadId/tasks')
  create(
    @CurrentAgent() agent: AuthAgent,
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(agent.agencyId, agent.id, leadId, dto);
  }

  @Patch('tasks/:id')
  update(@CurrentAgent() agent: AuthAgent, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(agent.agencyId, id, dto);
  }
}
