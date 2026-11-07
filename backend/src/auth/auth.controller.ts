import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto/auth.dto.js';

@ApiTags('Autenticación')
@ApiTooManyRequestsResponse({
  description: 'Demasiados intentos, espera un minuto',
})
@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Registrar un usuario' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({ description: 'El email ya está registrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** Máx. 5 intentos por minuto por IP: mitiga ataques de fuerza bruta. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Iniciar sesión y obtener un JWT' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales incorrectas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
