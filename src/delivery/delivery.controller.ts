import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { DeliveryService } from './delivery.service';
import {
  AssignOrderDto,
  AutoAssignDto,
  OrderActionDto,
  ProofOfDeliveryDto,
  RegisterDeliveryDto,
  RejectDeliveryDto,
  UpdateDeliveryProfileDto,
  UpdateLocationDto,
  UploadDeliveryDocumentsDto,
} from './dto/delivery.dto';

@ApiTags('delivery')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'delivery', version: '1' })
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  // ---------- onboarding / KYC ----------

  @Post('register')
  @Roles(Role.DELIVERY)
  @ApiOperation({
    summary: 'Register delivery partner profile (Aadhaar/PAN/DL/bank/vehicle)',
  })
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeliveryDto) {
    return this.delivery.register(user.userId, dto);
  }

  @Post('upload-documents')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Upload KYC documents (DL, Aadhaar, PAN, RC)' })
  uploadDocuments(
    @CurrentUser() user: AuthUser,
    @Body() dto: UploadDeliveryDocumentsDto,
  ) {
    return this.delivery.uploadDocuments(user.userId, dto.documents);
  }

  @Post('submit-kyc')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Submit KYC for admin review' })
  submitKyc(@CurrentUser() user: AuthUser) {
    return this.delivery.submitKyc(user.userId);
  }

  @Get('profile')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Get own delivery profile' })
  profile(@CurrentUser() user: AuthUser) {
    return this.delivery.getProfile(user.userId);
  }

  @Put('profile')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Update own delivery profile' })
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDeliveryProfileDto,
  ) {
    return this.delivery.updateProfile(user.userId, dto);
  }

  @Get('earnings')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Earnings dashboard' })
  earnings(@CurrentUser() user: AuthUser) {
    return this.delivery.earnings(user.userId);
  }

  // ---------- live operations ----------

  @Post('online')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Go online' })
  online(@CurrentUser() user: AuthUser) {
    return this.delivery.goOnline(user.userId);
  }

  @Post('offline')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Go offline' })
  offline(@CurrentUser() user: AuthUser) {
    return this.delivery.goOffline(user.userId);
  }

  @Get('orders')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'List assigned orders' })
  orders(@CurrentUser() user: AuthUser) {
    return this.delivery.listAssignedOrders(user.userId);
  }

  @Post('accept')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Accept an assigned order' })
  accept(@CurrentUser() user: AuthUser, @Body() dto: OrderActionDto) {
    return this.delivery.accept(user.userId, dto.orderId);
  }

  @Post('pickup')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Confirm order pickup (out for delivery)' })
  pickup(@CurrentUser() user: AuthUser, @Body() dto: OrderActionDto) {
    return this.delivery.markPickedUp(user.userId, dto.orderId);
  }

  @Post('location')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Update current location' })
  location(@CurrentUser() user: AuthUser, @Body() dto: UpdateLocationDto) {
    return this.delivery.updateLocation(user.userId, dto.lat, dto.lng);
  }

  @Post('proof-of-delivery')
  @Roles(Role.DELIVERY)
  @ApiOperation({
    summary: 'Mark delivered with proof (OTP + photo), credits earnings',
  })
  proofOfDelivery(
    @CurrentUser() user: AuthUser,
    @Body() dto: ProofOfDeliveryDto,
  ) {
    return this.delivery.markDelivered(
      user.userId,
      dto.orderId,
      dto.otp,
      dto.photoUrl,
    );
  }

  // ---------- admin: assignment & approval workflow ----------

  @Post(':id/assign')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Assign an order to a delivery partner' })
  assign(@Param('id') id: string, @Body() dto: AssignOrderDto) {
    return this.delivery.assign(id, dto.orderId);
  }

  @Post('auto-assign')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: '[Admin] Auto-assign an order to the nearest available partner',
  })
  autoAssign(@Body() dto: AutoAssignDto) {
    return this.delivery.autoAssign(dto.orderId, dto.lat, dto.lng, dto.zone);
  }

  @Post(':id/payout')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Settle weekly payout for a partner' })
  payout(@Param('id') id: string) {
    return this.delivery.runWeeklyPayout(id);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Approve a delivery partner' })
  approve(@Param('id') id: string) {
    return this.delivery.approve(id);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Reject a delivery partner' })
  reject(@Param('id') id: string, @Body() dto: RejectDeliveryDto) {
    return this.delivery.reject(id, dto.reason);
  }

  @Post(':id/verify-kyc')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Verify a delivery partner KYC' })
  verifyKyc(@Param('id') id: string) {
    return this.delivery.verifyKyc(id);
  }
}
