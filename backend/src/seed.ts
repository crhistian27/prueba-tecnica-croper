/**
 * Carga datos de demostración: un usuario admin y productos agropecuarios.
 * Es idempotente: se puede ejecutar varias veces sin duplicar datos.
 *
 *   npm run seed            (desarrollo)
 *   node dist/seed.js       (producción / Docker)
 */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AppModule } from './app.module.js';
import {
  Product,
  ProductCategory as C,
} from './products/schemas/product.schema.js';
import { UsersService } from './users/users.service.js';

const ADMIN = {
  name: 'Administrador',
  email: process.env.SEED_ADMIN_EMAIL ?? 'admin@croper.com',
  password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123*',
};

const PRODUCTS: Array<Omit<Product, 'createdAt' | 'updatedAt'>> = [
  {
    sku: 'FER-T15-50',
    name: 'Fertilizante Triple 15 x 50 kg',
    category: C.Fertilizantes,
    price: 185000,
    stock: 40,
    description: 'NPK 15-15-15 para cultivos de ciclo corto.',
  },
  {
    sku: 'FER-UREA-50',
    name: 'Urea 46% x 50 kg',
    category: C.Fertilizantes,
    price: 165000,
    stock: 55,
    description: 'Fuente de nitrógeno de alta concentración.',
  },
  {
    sku: 'FER-DAP-50',
    name: 'Fosfato diamónico DAP x 50 kg',
    category: C.Fertilizantes,
    price: 198000,
    stock: 30,
    description: 'Ideal para siembra y desarrollo radicular.',
  },
  {
    sku: 'FER-KCL-50',
    name: 'Cloruro de potasio x 50 kg',
    category: C.Fertilizantes,
    price: 172000,
    stock: 25,
    description: 'Mejora llenado de fruto y calidad.',
  },
  {
    sku: 'FER-ORG-40',
    name: 'Abono orgánico compostado x 40 kg',
    category: C.Fertilizantes,
    price: 38000,
    stock: 120,
    description: 'Gallinaza compostada, mejora la estructura del suelo.',
  },
  {
    sku: 'FER-FOL-1L',
    name: 'Fertilizante foliar completo x 1 L',
    category: C.Fertilizantes,
    price: 32000,
    stock: 80,
    description: 'Micronutrientes de rápida absorción.',
  },
  {
    sku: 'SEM-MAIZ-20',
    name: 'Semilla de maíz híbrido x 20 kg',
    category: C.Semillas,
    price: 520000,
    stock: 18,
    description: 'Alto rendimiento para clima cálido.',
  },
  {
    sku: 'SEM-FRIJ-5',
    name: 'Semilla de fríjol cargamanto x 5 kg',
    category: C.Semillas,
    price: 95000,
    stock: 35,
    description: 'Semilla certificada.',
  },
  {
    sku: 'SEM-ARROZ-40',
    name: 'Semilla de arroz certificada x 40 kg',
    category: C.Semillas,
    price: 210000,
    stock: 22,
    description: 'Variedad resistente a piricularia.',
  },
  {
    sku: 'SEM-TOM-1000',
    name: 'Semilla de tomate chonto x 1000 und',
    category: C.Semillas,
    price: 78000,
    stock: 60,
    description: 'Para invernadero y campo abierto.',
  },
  {
    sku: 'SEM-PAST-10',
    name: 'Semilla de pasto Brachiaria x 10 kg',
    category: C.Semillas,
    price: 260000,
    stock: 14,
    description: 'Pastoreo y alta producción de forraje.',
  },
  {
    sku: 'SEM-CEB-500',
    name: 'Semilla de cebolla de rama x 500 g',
    category: C.Semillas,
    price: 45000,
    stock: 48,
    description: 'Ciclo corto, alta adaptabilidad.',
  },
  {
    sku: 'AGQ-GLIF-1L',
    name: 'Herbicida glifosato x 1 L',
    category: C.Agroquimicos,
    price: 28000,
    stock: 90,
    description: 'Control de malezas de hoja ancha y angosta.',
  },
  {
    sku: 'AGQ-FUNG-1L',
    name: 'Fungicida sistémico x 1 L',
    category: C.Agroquimicos,
    price: 67000,
    stock: 42,
    description: 'Control preventivo y curativo de hongos.',
  },
  {
    sku: 'AGQ-INSE-1L',
    name: 'Insecticida de contacto x 1 L',
    category: C.Agroquimicos,
    price: 54000,
    stock: 37,
    description: 'Amplio espectro para plagas chupadoras.',
  },
  {
    sku: 'AGQ-COAD-1L',
    name: 'Coadyuvante agrícola x 1 L',
    category: C.Agroquimicos,
    price: 19000,
    stock: 70,
    description: 'Mejora la adherencia de las aplicaciones.',
  },
  {
    sku: 'HER-MACH-22',
    name: 'Machete 22 pulgadas',
    category: C.Herramientas,
    price: 26000,
    stock: 100,
    description: 'Acero templado con cacha plástica.',
  },
  {
    sku: 'HER-FUMI-20',
    name: 'Fumigadora de espalda 20 L',
    category: C.Herramientas,
    price: 189000,
    stock: 16,
    description: 'Bomba manual con boquilla regulable.',
  },
  {
    sku: 'HER-PALA-01',
    name: 'Pala cuadrada con cabo',
    category: C.Herramientas,
    price: 42000,
    stock: 45,
    description: 'Para labores de campo y construcción.',
  },
  {
    sku: 'HER-AZAD-01',
    name: 'Azadón con cabo de madera',
    category: C.Herramientas,
    price: 39000,
    stock: 50,
    description: 'Para desyerbe y preparación de suelo.',
  },
  {
    sku: 'HER-GUAD-01',
    name: 'Guadaña a gasolina 52 cc',
    category: C.Herramientas,
    price: 780000,
    stock: 6,
    description: 'Motor 2 tiempos, incluye cuchilla y nylon.',
  },
  {
    sku: 'HER-TIJ-01',
    name: 'Tijera de podar profesional',
    category: C.Herramientas,
    price: 58000,
    stock: 33,
    description: 'Corte limpio hasta 2 cm de diámetro.',
  },
  {
    sku: 'NUT-CONC-40',
    name: 'Concentrado bovino lechería x 40 kg',
    category: C.NutricionAnimal,
    price: 98000,
    stock: 75,
    description: '18% proteína para vacas en producción.',
  },
  {
    sku: 'NUT-SAL-40',
    name: 'Sal mineralizada x 40 kg',
    category: C.NutricionAnimal,
    price: 115000,
    stock: 60,
    description: 'Con fósforo al 8% para ganado.',
  },
  {
    sku: 'NUT-POLL-40',
    name: 'Concentrado pollo engorde x 40 kg',
    category: C.NutricionAnimal,
    price: 105000,
    stock: 40,
    description: 'Etapa de finalización.',
  },
  {
    sku: 'NUT-CERD-40',
    name: 'Concentrado cerdo levante x 40 kg',
    category: C.NutricionAnimal,
    price: 99000,
    stock: 28,
    description: 'Formulado para ganancia de peso.',
  },
  {
    sku: 'RIE-CINT-1000',
    name: 'Cinta de goteo x 1000 m',
    category: C.Riego,
    price: 340000,
    stock: 12,
    description: 'Emisores cada 20 cm.',
  },
  {
    sku: 'RIE-ASPE-01',
    name: 'Aspersor de impacto 1/2"',
    category: C.Riego,
    price: 24000,
    stock: 85,
    description: 'Cobertura de hasta 12 m de radio.',
  },
  {
    sku: 'RIE-MANG-100',
    name: 'Manguera agrícola 1" x 100 m',
    category: C.Riego,
    price: 210000,
    stock: 20,
    description: 'Polietileno de alta resistencia.',
  },
  {
    sku: 'RIE-TANQ-1000',
    name: 'Tanque de almacenamiento 1000 L',
    category: C.Riego,
    price: 420000,
    stock: 8,
    description: 'Polietileno con protección UV.',
  },
  {
    sku: 'OTR-POLI-100',
    name: 'Polisombra 65% x 100 m',
    category: C.Otros,
    price: 560000,
    stock: 5,
    description: 'Rollo de 4 m de ancho para viveros.',
  },
  {
    sku: 'OTR-BOTA-01',
    name: 'Botas de caucho caña alta',
    category: C.Otros,
    price: 48000,
    stock: 64,
    description: 'Antideslizantes, tallas 36 a 44.',
  },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const users = app.get(UsersService);
    if (await users.findByEmail(ADMIN.email)) {
      console.log(`Usuario ${ADMIN.email} ya existe`);
    } else {
      await users.create(ADMIN);
      console.log(`Usuario creado: ${ADMIN.email}`);
    }

    const productModel = app.get<Model<Product>>(getModelToken(Product.name));
    const result = await productModel.bulkWrite(
      PRODUCTS.map((p) => ({
        updateOne: {
          filter: { sku: p.sku },
          update: { $setOnInsert: p },
          upsert: true,
        },
      })),
    );
    console.log(
      `Productos insertados: ${result.upsertedCount} (ya existentes: ${PRODUCTS.length - result.upsertedCount})`,
    );
  } finally {
    await app.close();
  }
}

await seed();
