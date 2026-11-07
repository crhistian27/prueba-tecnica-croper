import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

/**
 * Configuración compartida entre main.ts y los tests e2e,
 * para que los tests prueben exactamente la misma app que corre en producción.
 */
export function setupApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  // Detrás de nginx, req.ip sería siempre la IP del proxy y el rate limiting
  // bloquearía a todos los usuarios a la vez. Se confía solo en N saltos.
  const trustProxy = config.getOrThrow<number>('TRUST_PROXY');
  if (trustProxy > 0) {
    (
      app.getHttpAdapter().getInstance() as {
        set: (k: string, v: number) => void;
      }
    ).set('trust proxy', trustProxy);
  }

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: config
      .getOrThrow<string>('CORS_ORIGIN')
      .split(',')
      .map((o) => o.trim()),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // ...y rechaza la petición si las trae
      transform: true,
    }),
  );
  app.enableShutdownHooks();
}

export function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Croper – API de Productos')
      .setDescription(
        'API REST para la gestión de productos agropecuarios.\n\n' +
          '1. Inicia sesión en `POST /api/auth/login` (usuario demo: `admin@croper.com` / `Admin123*`).\n' +
          '2. Copia el `accessToken` y pulsa **Authorize**.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
