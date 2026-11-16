import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Public } from '../auth/decorators';
import { WebhookTokenGuard } from './webhook-token.guard';
import { WhatsAppMessageDto } from './whatsapp.dto';
import { WhatsAppService } from './whatsapp.service';

/**
 * Where our WhatsApp provider posts each message a lead sends to an agency's number. This is a fake of a real
 * provider's webhook: nothing here talks to WhatsApp. `pnpm whatsapp` sends one from the command line.
 */
@Controller('webhooks/whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  @Public()
  @UseGuards(WebhookTokenGuard)
  @Post()
  @HttpCode(200)
  receive(@Body() dto: WhatsAppMessageDto) {
    return this.whatsapp.receive(dto);
  }
}
