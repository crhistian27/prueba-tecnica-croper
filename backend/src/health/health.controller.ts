import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Connection } from 'mongoose';
import { Public } from '../common/decorators/public.decorator.js';

@ApiTags('Salud')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: 'Estado de la API y de la conexión a MongoDB' })
  @ApiOkResponse({ schema: { example: { status: 'ok', database: 'up' } } })
  check() {
    return {
      status: 'ok',
      database: this.connection.readyState === 1 ? 'up' : 'down',
    };
  }
}
