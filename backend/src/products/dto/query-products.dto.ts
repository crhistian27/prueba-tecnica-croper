import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductCategory } from '../schemas/product.schema.js';

export const SORTABLE_FIELDS = ['name', 'price', 'stock', 'createdAt'] as const;
export type SortField = (typeof SORTABLE_FIELDS)[number];

export class QueryProductsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Busca por nombre o SKU',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ProductCategory })
  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @ApiPropertyOptional({ enum: SORTABLE_FIELDS, default: 'createdAt' })
  @IsIn(SORTABLE_FIELDS)
  @IsOptional()
  sortBy: SortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  order: 'asc' | 'desc' = 'desc';
}
