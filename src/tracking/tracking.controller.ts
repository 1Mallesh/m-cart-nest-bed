import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PushLocationDto } from './dto/tracking.dto';
import { TrackingService } from './tracking.service';

@ApiTags('tracking')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'tracking', version: '1' })
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  @Post('location')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Push a delivery location ping' })
  pushLocation(@CurrentUser() user: AuthUser, @Body() dto: PushLocationDto) {
    return this.tracking.pushLocation(
      dto.orderId,
      user.userId,
      dto.lat,
      dto.lng,
    );
  }

  @Get('order/:id')
  @ApiOperation({ summary: 'Get the full location history for an order' })
  history(@Param('id') id: string) {
    return this.tracking.getHistory(id);
  }

  @Get('live/:id')
  @ApiOperation({ summary: 'Get the latest live location for an order' })
  live(@Param('id') id: string) {
    return this.tracking.getLatest(id);
  }
}
