import { HttpErrorResponse } from '@angular/common/http';
import { toFriendlyMessage } from './http-error';

const httpError = (status: number, message?: string | string[]) =>
  new HttpErrorResponse({ status, error: message ? { statusCode: status, message } : null });

describe('toFriendlyMessage', () => {
  it('sin conexión (status 0)', () => {
    expect(toFriendlyMessage(httpError(0))).toContain('No hay conexión');
  });

  it('usa el mensaje de la API cuando existe', () => {
    expect(toFriendlyMessage(httpError(409, 'Ya existe un registro con ese sku'))).toBe(
      'Ya existe un registro con ese sku',
    );
  });

  it('une la lista de errores de validación', () => {
    expect(
      toFriendlyMessage(httpError(400, ['El nombre es obligatorio', 'Categoría inválida'])),
    ).toBe('El nombre es obligatorio. Categoría inválida');
  });

  it('rate limit (429)', () => {
    expect(toFriendlyMessage(httpError(429))).toContain('Demasiados intentos');
  });

  it('nunca muestra detalles técnicos de un error 5xx', () => {
    expect(toFriendlyMessage(httpError(500, 'MongoServerError: connection refused'))).toBe(
      'El servidor tuvo un problema. Intenta de nuevo en unos minutos.',
    );
  });

  it('errores que no son HTTP', () => {
    expect(toFriendlyMessage(new Error('boom'))).toBe(
      'Ocurrió un error inesperado. Intenta de nuevo.',
    );
  });
});
