import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogsService } from '../../modules/activity-logs/activity-logs.service';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLogInterceptor.name);

  constructor(private readonly activityLogsService: ActivityLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { url } = request;

    return next.handle().pipe(
      tap(() => {
        // Auth operations (register, login, logout) are explicitly logged in AuthService to prevent duplicate writes (PERF-01)
        // Non-auth automated resource actions can be logged here cleanly without floating promises (PERF-02).
        if (url.includes('/auth/')) {
          return;
        }
      }),
    );
  }
}
