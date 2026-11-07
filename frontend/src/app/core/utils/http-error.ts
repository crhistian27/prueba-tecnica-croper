import { HttpErrorResponse } from '@angular/common/http';

/** Formato de error que devuelve la API (filtro global del backend). */
interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
}

/**
 * Convierte cualquier error HTTP en un mensaje entendible para el usuario.
 * Prioriza el mensaje de la API (ya viene en español) cuando es útil.
 */
export function toFriendlyMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }

  const body = (error.error ?? {}) as ApiErrorBody;
  const apiMessage = Array.isArray(body.message) ? body.message.join('. ') : body.message;

  switch (error.status) {
    case 0:
      return 'No hay conexión con el servidor. Revisa tu conexión a internet e intenta de nuevo.';
    case 400:
      return apiMessage ?? 'Algunos datos no son válidos. Revisa el formulario.';
    case 401:
      return apiMessage ?? 'Tu sesión expiró. Inicia sesión de nuevo.';
    case 403:
      return 'No tienes permisos para realizar esta acción.';
    case 404:
      return apiMessage ?? 'El recurso que buscas no existe o fue eliminado.';
    case 409:
      return apiMessage ?? 'Ya existe un registro con esos datos.';
    case 429:
      return 'Demasiados intentos. Espera un minuto antes de volver a intentarlo.';
    default:
      return error.status >= 500
        ? 'El servidor tuvo un problema. Intenta de nuevo en unos minutos.'
        : (apiMessage ?? 'Ocurrió un error inesperado. Intenta de nuevo.');
  }
}
