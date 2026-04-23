import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import mongoose from 'mongoose';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
    logger.log('✅ MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    logger.error('❌ MongoDB connection error', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
    logger.warn('⚠️ MongoDB disconnected');
  });

  const app = await NestFactory.create(AppModule);
  
  // Check if already connected (connection may have fired during app creation)
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB connected (already connected)');
    logger.log('✅ MongoDB connected (already connected)');
  }
  
  const port = process.env.PORT || 3000;

  await app.listen(port);
  logger.log(`🚀 Notification Service running on port ${port}`);
}

bootstrap();