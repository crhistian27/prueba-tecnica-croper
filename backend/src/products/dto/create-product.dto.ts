import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductCategory } from '../schemas/product.schema.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateProductDto {
  @ApiProperty({ example: 'Fertilizante Triple 15 x 50 kg', maxLength: 120 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    example: 'Fertilizante NPK 15-15-15 para cultivos de ciclo corto',
    maxLength: 1000,
  })
  @Transform(trim)
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 185000, minimum: 0, description: 'Precio en COP' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número' },
  )
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;

  @ApiProperty({ example: 40, minimum: 0 })
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number;

  @ApiProperty({
    enum: ProductCategory,
    example: ProductCategory.Fertilizantes,
  })
  @IsEnum(ProductCategory, { message: 'Categoría inválida' })
  category: ProductCategory;

  @ApiProperty({
    example: 'FER-T15-50',
    description: 'Código único. Letras, números y guiones.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z0-9-]{3,30}$/, {
    message:
      'El SKU debe tener entre 3 y 30 caracteres: letras, números o guiones',
  })
  sku: string;
}
