import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check(): {
    status: 'ok' | 'degraded';
    service: string;
    mongo: 'connected' | 'disconnected';
    timestamp: string;
  } {
    const ready = this.connection.readyState === 1;
    return {
      status: ready ? 'ok' : 'degraded',
      service: 'autoflow-notification-service',
      mongo: ready ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
