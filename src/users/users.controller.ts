import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ListUsersQueryDto,
  UpdateProfileDto,
  UpdateUserRolesDto,
  UpdateUserStatusDto,
} from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // ---------- self-service (any authenticated user) ----------

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  me(@CurrentUser() user: AuthUser) {
    return this.users.getOrThrow(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile (name / email / phone)' })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.userId, dto);
  }

  // ---------- admin: user management ----------

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] List users (paginated, filterable)' })
  list(@Query() query: ListUsersQueryDto) {
    return this.users.list(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Get a user by id' })
  getOne(@Param('id') id: string) {
    return this.users.getOrThrow(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Activate / deactivate a user' })
  setStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.users.setActive(id, dto.isActive);
  }

  @Patch(':id/roles')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "[Admin] Update a user's roles" })
  setRoles(@Param('id') id: string, @Body() dto: UpdateUserRolesDto) {
    return this.users.setRoles(id, dto.roles);
  }
}
