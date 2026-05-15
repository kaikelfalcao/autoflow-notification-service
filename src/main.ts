import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AutoFlow Notification Service')
    .setDescription('API for querying notifications and managing templates')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Notification Service running on port ${port}`);
  logger.log(`Swagger: http://localhost:${port}/api`);
}

bootstrap();
