import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';

class EnvConfig {
  @IsInt()
  @Min(1)
  @IsOptional()
  PORT: number = 3005;

  @IsIn(['development', 'production', 'test'])
  @IsOptional()
  NODE_ENV: string = 'development';

  @IsIn(['info', 'debug', 'warn', 'error'])
  @IsOptional()
  LOG_LEVEL: string = 'info';

  @IsString()
  @IsNotEmpty()
  MONGO_URI: string;

  @IsString()
  @IsNotEmpty()
  RABBITMQ_URL: string;

  @IsString()
  @IsOptional()
  CORRELATION_ID_HEADER: string = 'x-correlation-id';
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvConfig {
  const validated = plainToInstance(EnvConfig, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }
  return validated;
}
