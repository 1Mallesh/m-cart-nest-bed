import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
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
  AddMoneyDto,
  WalletPaginationDto,
  WithdrawDto,
} from './dto/wallet.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@Controller({ path: 'wallet', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER, Role.VENDOR)
@ApiBearerAuth('access-token')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get the wallet balance' })
  getBalance(@CurrentUser() user: AuthUser) {
    return this.wallet.getBalance(user.userId);
  }

  @Post('add-money')
  @ApiOperation({ summary: 'Add money to the wallet' })
  addMoney(@CurrentUser() user: AuthUser, @Body() dto: AddMoneyDto) {
    return this.wallet.addMoney(user.userId, dto.amount, dto.reason);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw money from the wallet' })
  withdraw(@CurrentUser() user: AuthUser, @Body() dto: WithdrawDto) {
    return this.wallet.withdraw(user.userId, dto.amount, dto.reason);
  }

  @Get('history')
  @ApiOperation({ summary: 'List wallet transactions' })
  history(
    @CurrentUser() user: AuthUser,
    @Query() pagination: WalletPaginationDto,
  ) {
    return this.wallet.history(user.userId, pagination);
  }
}
