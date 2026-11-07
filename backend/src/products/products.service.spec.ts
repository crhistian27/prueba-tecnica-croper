import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { escapeRegex, ProductsService } from './products.service.js';
import { Product, ProductCategory } from './schemas/product.schema.js';

/** Crea una consulta encadenable de Mongoose (find().sort().skip()...) que resuelve `result`. */
function chain<T>(result: T) {
  const q = {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(result),
  };
  return q;
}

function query(overrides: Partial<QueryProductsDto> = {}): QueryProductsDto {
  return Object.assign(new QueryProductsDto(), overrides);
}

describe('ProductsService', () => {
  let service: ProductsService;
  const model = {
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product.name), useValue: model },
      ],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  describe('findAll', () => {
    it('pagina correctamente y calcula totalPages', async () => {
      const findQuery = chain([{ name: 'A' }, { name: 'B' }]);
      model.find.mockReturnValue(findQuery);
      model.countDocuments.mockReturnValue(chain(23));

      const result = await service.findAll(query({ page: 3, limit: 10 }));

      expect(findQuery.skip).toHaveBeenCalledWith(20);
      expect(findQuery.limit).toHaveBeenCalledWith(10);
      expect(result).toMatchObject({
        total: 23,
        page: 3,
        limit: 10,
        totalPages: 3,
      });
      expect(result.data).toHaveLength(2);
    });

    it('aplica búsqueda por nombre/SKU escapando caracteres especiales y filtro por categoría', async () => {
      model.find.mockReturnValue(chain([]));
      model.countDocuments.mockReturnValue(chain(0));

      await service.findAll(
        query({
          search: ' 15-15 (x) ',
          category: ProductCategory.Fertilizantes,
        }),
      );

      const filter = model.find.mock.calls[0][0];
      expect(filter.category).toBe(ProductCategory.Fertilizantes);
      expect(filter.$or).toHaveLength(2);
      const regex: RegExp = filter.$or[0].name;
      expect(regex.source).toBe('15-15 \\(x\\)');
      expect(regex.flags).toContain('i');
      // El mismo filtro se usa para contar
      expect(model.countDocuments).toHaveBeenCalledWith(filter);
    });

    it('ordena por el campo y dirección indicados', async () => {
      const findQuery = chain([]);
      model.find.mockReturnValue(findQuery);
      model.countDocuments.mockReturnValue(chain(0));

      await service.findAll(query({ sortBy: 'price', order: 'asc' }));

      expect(findQuery.sort).toHaveBeenCalledWith({ price: 1, _id: 1 });
    });
  });

  describe('findOne / update / remove', () => {
    it('lanza NotFoundException si el producto no existe', async () => {
      model.findById.mockReturnValue(chain(null));
      await expect(
        service.findOne('6650f1c2a1b2c3d4e5f60718'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('update ejecuta validaciones del schema y retorna el documento actualizado', async () => {
      const updated = { name: 'Nuevo' };
      model.findByIdAndUpdate.mockReturnValue(chain(updated));

      const result = await service.update('id', { name: 'Nuevo' });

      expect(result).toBe(updated);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        'id',
        { name: 'Nuevo' },
        { returnDocument: 'after', runValidators: true },
      );
    });

    it('update lanza NotFoundException si no existe', async () => {
      model.findByIdAndUpdate.mockReturnValue(chain(null));
      await expect(service.update('id', { price: 1 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('remove lanza NotFoundException si no existe', async () => {
      model.findByIdAndDelete.mockReturnValue(chain(null));
      await expect(service.remove('id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

describe('escapeRegex', () => {
  it('neutraliza metacaracteres de expresiones regulares', () => {
    expect(escapeRegex('.*+?^${}()|[]\\')).toBe(
      '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\',
    );
  });
});
