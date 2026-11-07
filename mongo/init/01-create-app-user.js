/**
 * Crea el usuario que usa la API, con MÍNIMO PRIVILEGIO:
 * solo lectura/escritura sobre la base de la aplicación (sin permisos de
 * administración, ni sobre otras bases, ni para crear usuarios).
 *
 * - Se ejecuta automáticamente la primera vez que arranca Mongo con el volumen
 *   vacío (docker-entrypoint-initdb.d).
 * - Es idempotente: también se puede aplicar a una base existente:
 *     docker compose exec mongo sh -c 'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" \
 *       -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin \
 *       /docker-entrypoint-initdb.d/01-create-app-user.js'
 */
const user = process.env.MONGO_APP_USER;
const pwd = process.env.MONGO_APP_PASSWORD;
const appDb = process.env.MONGO_INITDB_DATABASE;
// Bases adicionales (solo desarrollo, ej. la de tests e2e). Vacío en producción.
const extraDbs = (process.env.MONGO_APP_EXTRA_DBS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!user || !pwd || !appDb) {
  throw new Error('Faltan MONGO_APP_USER, MONGO_APP_PASSWORD o MONGO_INITDB_DATABASE');
}

const roles = [appDb, ...extraDbs].map((name) => ({ role: 'readWrite', db: name }));
const admin = db.getSiblingDB('admin');

if (admin.getUser(user)) {
  admin.updateUser(user, { pwd, roles });
  print(`Usuario "${user}" actualizado: readWrite en ${roles.map((r) => r.db).join(', ')}`);
} else {
  admin.createUser({ user, pwd, roles });
  print(`Usuario "${user}" creado: readWrite en ${roles.map((r) => r.db).join(', ')}`);
}
