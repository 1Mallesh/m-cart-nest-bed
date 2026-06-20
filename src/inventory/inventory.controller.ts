import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/inventory.dto';

@ApiTags('inventory')
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get inventory for a product (VENDOR/ADMIN)' })
  getByProduct(@Param('productId') productId: string) {
    return this.inventory.getByProduct(productId);
  }

  @Patch(':productId/adjust')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Adjust inventory quantity by a delta (VENDOR/ADMIN)',
  })
  adjust(
    @Param('productId') productId: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.inventory.adjust(productId, dto.delta);
  }
}
