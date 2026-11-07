/**
 * Pruebas e2e contra MongoDB real (base de datos aislada `croper_e2e`,
 * definida en vitest.config.e2e.ts). Requiere `docker compose up -d mongo`.
 */
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import type { Connection } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/setup-app.js';

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  const user = {
    name: 'Tester',
    email: 'tester@croper.com',
    password: 'Clave1234',
  };
  const product = {
    name: 'Semilla de prueba',
    price: 1500,
    stock: 10,
    category: 'semillas',
    sku: 'E2E-001',
  };

  /**
   * Limpia los documentos sin borrar la base ni los índices: el usuario de la
   * API solo tiene `readWrite` (mínimo privilegio), no permisos de dropDatabase.
   */
  async function clearDatabase() {
    const db = app.get<Connection>(getConnectionToken()).db!;
    for (const collection of await db.collections()) {
      await collection.deleteMany({});
    }
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
    await app.close();
  });

  describe('Auth', () => {
    it('registra un usuario sin exponer el password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(user)
        .expect(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({
        email: user.email,
        name: user.name,
      });
      expect(JSON.stringify(res.body)).not.toContain('password');
    });

    it('rechaza un email duplicado (409)', () =>
      request(app.getHttpServer())
        .post('/api/auth/register')
        .send(user)
        .expect(409));

    it('rechaza credenciales incorrectas con mensaje genérico (401)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: 'incorrecta1' })
        .expect(401);
      expect(res.body.message).toBe('Email o contraseña incorrectos');
    });

    it('inicia sesión y devuelve un JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(200);
      token = res.body.accessToken;
    });
  });

  describe('Productos', () => {
    let id: string;
    const auth = () => ({ Authorization: `Bearer ${token}` });

    it('exige JWT (401 sin token o con token inválido)', async () => {
      await request(app.getHttpServer()).get('/api/products').expect(401);
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', 'Bearer token.falso.123')
        .expect(401);
    });

    it('crea un producto', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .set(auth())
        .send(product)
        .expect(201);
      expect(res.body).toMatchObject(product);
      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body._id).toBeUndefined();
      id = res.body.id;
    });

    it('valida datos y rechaza propiedades no permitidas (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .set(auth())
        .send({ ...product, sku: 'E2E-002', price: -5, $where: '1' })
        .expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining(['El precio no puede ser negativo']),
      );
    });

    it('rechaza SKU duplicado (409)', () =>
      request(app.getHttpServer())
        .post('/api/products')
        .set(auth())
        .send(product)
        .expect(409));

    it('lista con paginación y búsqueda', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?page=1&limit=5&search=semilla')
        .set(auth())
        .expect(200);
      expect(res.body).toMatchObject({
        total: 1,
        page: 1,
        limit: 5,
        totalPages: 1,
      });
      expect(res.body.data[0].sku).toBe(product.sku);
    });

    it('devuelve indicadores del inventario', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products/stats')
        .set(auth())
        .expect(200);
      expect(res.body).toMatchObject({
        totalProducts: 1,
        totalUnits: product.stock,
        inventoryValue: product.price * product.stock,
        lowStock: 0,
        outOfStock: 0,
      });
    });

    it('actualiza parcialmente', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/products/${id}`)
        .set(auth())
        .send({ stock: 99 })
        .expect(200);
      expect(res.body.stock).toBe(99);
      expect(res.body.name).toBe(product.name);
    });

    it('responde 400 con un id inválido', () =>
      request(app.getHttpServer())
        .get('/api/products/no-es-un-id')
        .set(auth())
        .expect(400));

    it('elimina y luego responde 404', async () => {
      await request(app.getHttpServer())
        .delete(`/api/products/${id}`)
        .set(auth())
        .expect(204);
      await request(app.getHttpServer())
        .get(`/api/products/${id}`)
        .set(auth())
        .expect(404);
    });
  });
});
