import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Product, ProductDocument } from './schemas/product.schema.js';

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Escapa caracteres especiales para usar texto del usuario en un RegExp (evita ReDoS/inyección). */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  create(dto: CreateProductDto): Promise<ProductDocument> {
    return this.productModel.create(dto);
  }

  async findAll(query: QueryProductsDto): Promise<Paginated<ProductDocument>> {
    const { page, limit, search, category, sortBy, order } = query;

    const filter: QueryFilter<Product> = {};
    if (category) filter.category = category;
    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: regex }, { sku: regex }];
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ [sortBy]: order === 'asc' ? 1 : -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.productModel
      .findByIdAndUpdate(id, dto, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Producto no encontrado');
  }
}
