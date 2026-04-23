import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongoHealth implements OnModuleInit {
  private readonly logger = new Logger(MongoHealth.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  onModuleInit() {
    const state = this.connection.readyState;

    const statesMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    this.logger.log(`MongoDB state: ${statesMap[state]}`);

    if (state !== 1) {
      this.logger.error('MongoDB is NOT connected');
    } else {
      this.logger.log('✅ MongoDB is connected');
    }
    
  }
}