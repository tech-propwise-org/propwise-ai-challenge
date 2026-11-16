import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { config } from '../config';

const digest = (value: string) => createHash('sha256').update(value).digest();

/** The provider signs nothing in this fake: it sends a shared token in `X-Webhook-Token`, checked before the body. */
@Injectable()
export class WebhookTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const header = context.switchToHttp().getRequest<Request>().headers['x-webhook-token'];
    const token = Array.isArray(header) ? header[0] : header;
    if (!token || !timingSafeEqual(digest(token), digest(config.whatsappWebhookToken()))) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
