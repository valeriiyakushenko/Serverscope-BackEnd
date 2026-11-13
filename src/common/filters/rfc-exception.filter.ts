import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class RfcExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      type: "about:blank",
      title: exception.message || 'Error',
      status: status,
      detail: typeof exceptionResponse === 'object' ? (exceptionResponse as any).message : exceptionResponse,
      instance: request.url,
    });
  }
}