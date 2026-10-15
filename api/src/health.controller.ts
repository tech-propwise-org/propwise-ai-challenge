import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health() {
    // The timezone this API process runs in. Our test cases check it is UTC before they start.
    return { ok: true, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  }
}
