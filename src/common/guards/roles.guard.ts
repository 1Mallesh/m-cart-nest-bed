import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const roles: string[] = user?.roles ?? [];
    // SUPER_ADMIN inherits every permission (standard role hierarchy).
    if (roles.includes(Role.SUPER_ADMIN)) {
      return true;
    }
    const allowed = required.some((role) => roles.includes(role));
    if (!allowed) {
      throw new ForbiddenException('Insufficient role permissions');
    }
    return true;
  }
}
