import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Marks a route that needs no login. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export interface AuthAgent {
  id: string;
  agencyId: string;
}

/** The logged-in agent. Every query must be scoped to `agencyId`. */
export const CurrentAgent = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthAgent => ctx.switchToHttp().getRequest().agent,
);
