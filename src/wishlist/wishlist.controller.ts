import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
import { WishlistService } from './wishlist.service';
import { AddWishlistItemDto } from './dto/wishlist.dto';

@ApiTags('wishlist')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@Controller({ path: 'wishlist', version: '1' })
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user wishlist' })
  get(@CurrentUser() user: AuthUser) {
    return this.wishlist.get(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a product to the wishlist' })
  add(@CurrentUser() user: AuthUser, @Body() dto: AddWishlistItemDto) {
    return this.wishlist.add(user.userId, dto.productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove a product from the wishlist' })
  remove(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return this.wishlist.remove(user.userId, productId);
  }
}
