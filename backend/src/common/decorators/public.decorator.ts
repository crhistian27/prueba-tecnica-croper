import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un endpoint como público. Por defecto TODOS los endpoints
 * requieren JWT (guard global): la seguridad es opt-out, no opt-in.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
