import { Module } from '@nestjs/common';
import { WebhookTokenGuard } from './webhook-token.guard';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WebhookTokenGuard],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
