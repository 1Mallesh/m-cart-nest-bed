import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('cart')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@Controller({ path: 'cart', version: '1' })
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user cart' })
  getCart(@CurrentUser() user: AuthUser) {
    return this.cart.getCart(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add an item to the cart' })
  addItem(@CurrentUser() user: AuthUser, @Body() dto: AddCartItemDto) {
    return this.cart.addItem(user.userId, dto);
  }

  @Put(':itemId')
  @ApiOperation({ summary: 'Update the quantity of a cart item' })
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(user.userId, itemId, dto.quantity);
  }

  @Delete(':itemId')
  @ApiOperation({ summary: 'Remove an item from the cart' })
  removeItem(@CurrentUser() user: AuthUser, @Param('itemId') itemId: string) {
    return this.cart.removeItem(user.userId, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear the cart' })
  clear(@CurrentUser() user: AuthUser) {
    return this.cart.clear(user.userId);
  }
}
