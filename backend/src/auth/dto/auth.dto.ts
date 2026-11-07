import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @ApiProperty({ example: 'admin@croper.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'Admin123*' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MaxLength(72) // límite de bcrypt
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'juan@finca.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({
    example: 'Clave1234',
    description: 'Mínimo 8 caracteres, con al menos una letra y un número',
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener al menos una letra y un número',
  })
  password: string;
}

class AuthUserDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
}

export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty({
    example: 3600,
    description: 'Segundos hasta que expira el token',
  })
  expiresIn: number;
  @ApiProperty({ type: AuthUserDto }) user: AuthUserDto;
}
