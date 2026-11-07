import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum ProductCategory {
  Fertilizantes = 'fertilizantes',
  Semillas = 'semillas',
  Agroquimicos = 'agroquimicos',
  Herramientas = 'herramientas',
  NutricionAnimal = 'nutricion-animal',
  Riego = 'riego',
  Otros = 'otros',
}

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
})
export class Product {
  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  name: string;

  @Prop({ type: String, trim: true, maxlength: 1000, default: '' })
  description: string;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  stock: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ProductCategory),
    index: true,
  })
  category: ProductCategory;

  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  sku: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
