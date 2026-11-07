import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Base de datos aislada: los tests e2e nunca tocan los datos de desarrollo
    env: { MONGO_DB_NAME: 'croper_e2e', NODE_ENV: 'test' },
    fileParallelism: false,
  },
});
