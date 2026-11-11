import { plainToInstance } from 'class-transformer';
import { IsOptional, IsString, validateSync } from 'class-validator';
import { assertProductionAiConfig } from '../modules/ai-agent/ai-config.js';

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  CORS?: string;

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_SECRET?: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: true,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if (config.NODE_ENV === 'production') {
    const required = [
      'DATABASE_URL',
      'CORS',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'MAIL_HOST',
      'MAIL_PORT',
      'MAIL_USER',
      'MAIL_PASSWORD',
      'MAIL_FROM',
      'FORM_CONTACT',
      'BOOTSTRAP_ADMIN_PASSWORD',
      'NOTES_ENCRYPTION_KEY',
    ];
    const missing = required.filter((name) => !config[name]);

    if (missing.length > 0) {
      throw new Error(
        `Missing production environment variables: ${missing.join(', ')}`,
      );
    }

    assertProductionAiConfig(config);
  }

  return config;
}
