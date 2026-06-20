import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpsertFeatureFlagDto } from './dto/feature-flag.dto';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('feature-flags')
@Controller({ path: 'feature-flags', version: '1' })
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'List all feature flags (public toggles snapshot)' })
  list() {
    return this.service.list();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Check whether a feature flag is enabled' })
  async check(@Param('key') key: string) {
    return { key, enabled: await this.service.isEnabled(key) };
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create or update a feature flag (admin)' })
  upsert(@Body() dto: UpsertFeatureFlagDto) {
    return this.service.upsert(dto);
  }
}
