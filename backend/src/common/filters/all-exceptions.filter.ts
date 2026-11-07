import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Error as MongooseError, mongo } from 'mongoose';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/**
 * Formato de error uniforme para toda la API.
 * Los errores no controlados se registran en el log pero NUNCA se
 * exponen al cliente (sin stack traces ni detalles internos).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { statusCode, message } = this.resolve(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponse = {
      statusCode,
      error: HttpStatus[statusCode] ?? 'Error',
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : ((response as { message?: string | string[] }).message ??
            exception.message);
      return { statusCode: exception.getStatus(), message };
    }

    // Índice único violado (ej. SKU o email duplicado)
    if (
      exception instanceof mongo.MongoServerError &&
      exception.code === 11000
    ) {
      const field = Object.keys(exception.keyValue ?? {})[0] ?? 'campo';
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `Ya existe un registro con ese ${field}`,
      };
    }

    if (exception instanceof MongooseError.ValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: Object.values(exception.errors).map((e) => e.message),
      };
    }

    if (exception instanceof MongooseError.CastError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Valor inválido para ${exception.path}`,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
    };
  }
}
