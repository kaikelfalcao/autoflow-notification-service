import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongoHealth {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  isHealthy(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    return this.connection.readyState === 1;
  }
}
