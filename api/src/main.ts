import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ exposedHeaders: ['X-Total-Count'] });
  app.enableShutdownHooks();
  // 0.0.0.0 so a phone running Expo Go on the same Wi-Fi can reach the API.
  await app.listen(config.port(), '0.0.0.0');
  console.log(`API listening on http://localhost:${config.port()}`);
}

void bootstrap();
