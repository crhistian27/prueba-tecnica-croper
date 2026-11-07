import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import {
  PaginatedProductsDto,
  ProductResponseDto,
} from './dto/product-response.dto.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags('Productos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado' })
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar productos con paginación, búsqueda y filtros',
  })
  @ApiOkResponse({ type: PaginatedProductsDto })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por id' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  @ApiBadRequestResponse({ description: 'Id inválido' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un producto' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({ description: 'El SKU ya existe' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente un producto' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  @ApiConflictResponse({ description: 'El SKU ya existe' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiNoContentResponse({ description: 'Producto eliminado' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.productsService.remove(id);
  }
}
