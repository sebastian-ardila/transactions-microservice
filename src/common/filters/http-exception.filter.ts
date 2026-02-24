import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter that catches all unhandled exceptions
 * and normalizes them into a consistent JSON response format.
 *
 * @example Response shape:
 * {
 *   "statusCode": 400,
 *   "message": "Validation failed",
 *   "error": "BadRequestException",
 *   "path": "/api/transactions",
 *   "timestamp": "2026-02-23T20:00:00.000Z"
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  /**
   * Intercepts any thrown exception and sends a normalized error response.
   *
   * @param exception - The unhandled exception (HttpException or unknown)
   * @param host - Provides access to the request/response objects
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getStatusCode(exception);
    const message = this.getMessage(exception);
    const error = this.getErrorName(exception);

    response.status(status).json({
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Extracts the HTTP status code from the exception.
   * Defaults to 500 for non-HTTP exceptions (e.g. TypeError, DB errors).
   */
  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Extracts a human-readable message from the exception.
   *
   * NestJS HttpException.getResponse() can return:
   * - A plain string (e.g. `throw new BadRequestException('invalid')`)
   * - An object with a `message` string (e.g. `{ message: 'Not found' }`)
   * - An object with a `message` array (e.g. class-validator validation errors)
   *
   * This method handles all three cases and flattens arrays into a single string.
   */
  private getMessage(exception: unknown): string {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    const nestedMessage = (response as Record<string, unknown>).message;

    // class-validator returns an array of validation error strings
    if (Array.isArray(nestedMessage)) {
      return nestedMessage.join(', ');
    }

    return typeof nestedMessage === 'string' ? nestedMessage : 'Internal server error';
  }

  /**
   * Extracts the exception class name (e.g. "BadRequestException", "NotFoundException").
   * Defaults to "InternalServerError" for non-HTTP exceptions.
   */
  private getErrorName(exception: unknown): string {
    if (exception instanceof HttpException) {
      return exception.name;
    }
    return 'InternalServerError';
  }
}
