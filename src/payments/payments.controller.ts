import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
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
  CodConfirmDto,
  CreatePaymentOrderDto,
  RefundDto,
  VerifyPaymentDto,
  WebhookDto,
} from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a payment order (Razorpay)' })
  createOrder(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.payments.createOrder(user.userId, dto);
  }

  @Post('verify')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify a payment signature' })
  verify(@Body() dto: VerifyPaymentDto) {
    return this.payments.verify(dto);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Provider webhook (public)' })
  webhook(@Body() dto: WebhookDto) {
    return this.payments.handleWebhook(dto.payload);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Refund a payment (admin)' })
  refund(@Body() dto: RefundDto) {
    return this.payments.refund(dto.paymentId, dto.amount);
  }

  @Post('cod-confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirm a cash-on-delivery payment' })
  codConfirm(@CurrentUser() user: AuthUser, @Body() dto: CodConfirmDto) {
    return this.payments.codConfirm(user.userId, dto.orderId);
  }
}
