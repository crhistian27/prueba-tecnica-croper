import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Product, ProductDocument } from './schemas/product.schema.js';

/** Umbral por debajo del cual un producto se considera con stock bajo. */
export const LOW_STOCK_THRESHOLD = 10;

export interface ProductStats {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStock: number;
  outOfStock: number;
  lowStockThreshold: number;
}

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

  /** Indicadores del inventario calculados en MongoDB (una sola consulta). */
  async getStats(): Promise<ProductStats> {
    const [result] = await this.productModel
      .aggregate<Omit<ProductStats, 'lowStockThreshold'>>([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalUnits: { $sum: '$stock' },
            inventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
            lowStock: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$stock', 0] },
                      { $lt: ['$stock', LOW_STOCK_THRESHOLD] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
          },
        },
        { $project: { _id: 0 } },
      ])
      .exec();

    return {
      totalProducts: result?.totalProducts ?? 0,
      totalUnits: result?.totalUnits ?? 0,
      inventoryValue: result?.inventoryValue ?? 0,
      lowStock: result?.lowStock ?? 0,
      outOfStock: result?.outOfStock ?? 0,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    };
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
