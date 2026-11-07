/**
 * La API se consume siempre en la ruta relativa `/api`:
 * - En desarrollo, `ng serve` la redirige a http://localhost:3000 (proxy.conf.json).
 * - En Docker, nginx la redirige al contenedor de la API.
 * Así no hace falta CORS ni URLs distintas por entorno.
 */
export const environment = {
  apiUrl: '/api',
};
