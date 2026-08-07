import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  // CORS configuration
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Equipment Rental Management Platform API')
    .setDescription(
      'RESTful API documentation for Equipment Rental Management System',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & authorization endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Equipment', 'Equipment inventory and management')
    .addTag('Categories', 'Equipment categorization')
    .addTag('Reservations', 'Reservation lifecycle endpoints')
    .addTag('Payments', 'Payment processing endpoints')
    .addTag('Inventory', 'Warehouse inventory tracking')
    .addTag('Notifications', 'User notification endpoints')
    .addTag('Uploads', 'File upload and document management')
    .addTag('Dashboard', 'Admin analytics and dashboard endpoints')
    .addTag('Activity Logs', 'Audit logging endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  logger.log(`🚀 API Server running on http://localhost:${port}/api/v1`);
  logger.log(
    `📚 Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}
bootstrap();
