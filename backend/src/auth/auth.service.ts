import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../users/schemas/user.schema.js';
import { UsersService } from '../users/users.service.js';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto/auth.dto.js';

export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Hash ficticio para comparar cuando el usuario no existe: así el tiempo de
 * respuesta es similar exista o no el email (evita enumeración de usuarios).
 */
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    if (await this.usersService.findByEmail(dto.email)) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }
    const user = await this.usersService.create(dto);
    return this.buildResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const valid = await bcrypt.compare(
      dto.password,
      user?.password ?? DUMMY_HASH,
    );
    if (!user || !valid) {
      // Mensaje genérico: no revelar si el email existe
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    return this.buildResponse(user);
  }

  private async buildResponse(user: UserDocument): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id as string, email: user.email };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      expiresIn: this.config.getOrThrow<number>('JWT_EXPIRES_IN'),
      user: { id: user.id as string, name: user.name, email: user.email },
    };
  }
}
