import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const isProd = config.get<string>('NODE_ENV') === 'production';

  const prefix = config.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(prefix);

  // URI-based API versioning -> /api/v1/...
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: config.get<string>('API_VERSION', '1'),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Security headers.
  app.use(helmet());

  // CORS: restrict to an allowlist in production (CORS_ORIGINS=csv);
  // open in dev for convenience.
  const origins = config.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: origins ? origins.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });

  // Flush in-flight requests / close DB & broker connections on SIGTERM.
  app.enableShutdownHooks();

  // Swagger: never expose the spec/UI in production.
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('M-Cart API')
      .setDescription('Enterprise multi-vendor eCommerce backend')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addTag('auth', 'Authentication & login')
      .addTag('users', 'User management')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${prefix}/docs`, app, document);
  }

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`M-Cart running on http://localhost:${port}/${prefix}`);
  if (!isProd) {
    logger.log(`Swagger docs at http://localhost:${port}/${prefix}/docs`);
  }
}
bootstrap();
