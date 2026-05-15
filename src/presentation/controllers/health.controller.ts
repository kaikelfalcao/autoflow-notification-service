import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MongoHealth } from '../../infrastructure/health/mongo.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly mongoHealth: MongoHealth) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  readiness(): { status: string; mongo: boolean } {
    const mongo = this.mongoHealth.isHealthy();
    return { status: mongo ? 'ok' : 'degraded', mongo };
  }
}
