import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../schemas/product.schema.js';

/** Solo para documentación en Swagger. */
export class ProductResponseDto {
  @ApiProperty({ example: '6650f1c2a1b2c3d4e5f60718' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() price: number;
  @ApiProperty() stock: number;
  @ApiProperty({ enum: ProductCategory }) category: ProductCategory;
  @ApiProperty() sku: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedProductsDto {
  @ApiProperty({ type: [ProductResponseDto] }) data: ProductResponseDto[];
  @ApiProperty({ example: 42 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 10 }) limit: number;
  @ApiProperty({ example: 5 }) totalPages: number;
}
