// eslint-disable-next-line @typescript-eslint/no-require-imports
require('newrelic');
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const logger = new Logger('Bootstrap');
  const port = Number(process.env.PORT ?? 3005);
  await app.listen(port);
  logger.log(`Notification Service running on port ${port}`);
}

void bootstrap();
