import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { toAgentDto } from '../common/dto';
import { Agent } from '../entities';
import { verifyPassword } from './password';

@Injectable()
export class AuthService {
  constructor(
    private readonly em: EntityManager,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const agent = await this.em.findOne(Agent, { email: email.trim().toLowerCase() }, { populate: ['agency'] });
    if (!agent || !(await verifyPassword(password, agent.passwordHash))) {
      throw new UnauthorizedException('Wrong email or password');
    }
    const accessToken = await this.jwt.signAsync({ sub: agent.id, agencyId: agent.agency.id });
    return { accessToken, agent: toAgentDto(agent) };
  }

  async me(agentId: string) {
    const agent = await this.em.findOneOrFail(Agent, agentId, { populate: ['agency'] });
    return toAgentDto(agent);
  }
}
