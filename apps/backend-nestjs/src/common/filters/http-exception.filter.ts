import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilterGlobal implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let detail = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        detail = res;
      } else if (typeof res === 'object' && res !== null) {
        detail = (res as any).message || (res as any).detail || exception.message;
        if (Array.isArray(detail)) {
          detail = detail.join(', ');
        }
      }
    } else {
      console.error('Unhandled exception:', exception);
    }

    response.status(status).json({ detail });
  }
}
