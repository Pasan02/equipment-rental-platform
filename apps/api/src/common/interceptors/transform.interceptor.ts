import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === 'object' && 'data' in result && ('meta' in result || 'message' in result)) {
          return {
            success: true,
            data: result.data,
            ...(result.message ? { message: result.message } : {}),
            ...(result.meta ? { meta: result.meta } : {}),
          };
        }

        return {
          success: true,
          data: result,
        };
      }),
    );
  }
}
