import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Variables de entorno requeridas por la API.
 * Si falta alguna o es inválida, la aplicación no arranca (fail fast).
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  MONGO_URI: string;

  @IsString()
  @IsOptional()
  MONGO_DB_NAME: string = 'croper';

  /** Mínimo 32 caracteres para evitar secretos débiles. */
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  /** Duración del access token en segundos. */
  @IsInt()
  @Min(60)
  @IsOptional()
  JWT_EXPIRES_IN: number = 3600;

  /** Orígenes permitidos por CORS, separados por coma. */
  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:4200';
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const detail = errors
      .map(
        (e) =>
          `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
      )
      .join('\n');
    throw new Error(`Variables de entorno inválidas:\n${detail}`);
  }
  return validated;
}
