import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (userRole?: UserRole): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { id: 'test-uuid', role: userRole } : undefined,
        }),
      }),
    } as any;
  };

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext(UserRole.CUSTOMER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if required roles match user role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.STAFF]);
    const context = createMockContext(UserRole.STAFF);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access for ADMIN role regardless of required roles (Admin Override)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.WAREHOUSE]);
    const context = createMockContext(UserRole.ADMIN);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user role does not match required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.STAFF]);
    const context = createMockContext(UserRole.CUSTOMER);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if request has no authenticated user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.CUSTOMER]);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
