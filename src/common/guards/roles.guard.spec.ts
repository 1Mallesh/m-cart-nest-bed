import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';

function ctx(roles: string[]): any {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: { roles } }) }),
    getHandler: () => null,
    getClass: () => null,
  };
}

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it('allows when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(ctx(['customer']))).toBe(true);
  });

  it('allows when the user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(ctx(['admin']))).toBe(true);
  });

  it('lets SUPER_ADMIN through any admin route (role hierarchy)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(ctx(['super_admin']))).toBe(true);
  });

  it('throws Forbidden when the role is missing', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(ctx(['customer']))).toThrow(
      ForbiddenException,
    );
  });
});
