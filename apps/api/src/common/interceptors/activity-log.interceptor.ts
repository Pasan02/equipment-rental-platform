import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityAction } from '@prisma/client';
import { ActivityLogsService } from '../../modules/activity-logs/activity-logs.service';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLogInterceptor.name);

  constructor(private readonly activityLogsService: ActivityLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    const ipAddress = ip || (headers['x-forwarded-for'] as string);
    const userAgent = headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: async (responseBody) => {
          try {
            // Determine if the request matches an action to log automatically
            let action: ActivityAction | null = null;
            let entityType: string | null = null;
            let entityId: string | null = null;
            let newValues: any = undefined;

            if (url.includes('/auth/register') && method === 'POST') {
              action = ActivityAction.REGISTER;
              entityType = 'USER';
              entityId = responseBody?.data?.id || responseBody?.id;
            } else if (url.includes('/auth/login') && method === 'POST') {
              action = ActivityAction.LOGIN;
              entityType = 'USER';
              entityId = responseBody?.data?.user?.id || responseBody?.user?.id;
            } else if (url.includes('/auth/logout') && method === 'POST') {
              action = ActivityAction.LOGOUT;
              entityType = 'USER';
              entityId = user?.id;
            }

            if (action) {
              await this.activityLogsService.createLog({
                userId: user?.id || entityId || undefined,
                action,
                entityType: entityType || undefined,
                entityId: entityId || undefined,
                newValues,
                ipAddress,
                userAgent,
              });
            }
          } catch (error) {
            this.logger.error(`Failed to auto-create activity log: ${error.message}`, error.stack);
          }
        },
      }),
    );
  }
}
