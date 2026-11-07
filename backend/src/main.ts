import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp, setupSwagger } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  setupSwagger(app);

  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(port);
  Logger.log(
    `API en http://localhost:${port}/api — Swagger en /api/docs`,
    'Bootstrap',
  );
}
await bootstrap();
