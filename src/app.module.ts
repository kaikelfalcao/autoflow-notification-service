import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { HealthModule } from './health/health.module';
import { NotificationModule } from './modules/notification/notification.module';
import { validateEnv } from './shared/config/env.config';
import { LoggerModule } from './shared/logger/logger.module';
import { AppRabbitMqModule } from './shared/messaging/rabbitmq.module';
import { CorrelationIdMiddleware } from './shared/middlewares/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGO_URI') ??
          'mongodb://localhost:27017/notification',
      }),
    }),
    AppRabbitMqModule,
    NotificationModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
