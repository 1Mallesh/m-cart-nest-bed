import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
  AssignDeliveryDto,
  CreateOrderDto,
  PaginationDto,
  UpdateStatusDto,
} from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller({ path: 'orders', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Place a new order' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.userId, dto);
  }

  @Get()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'List the current customer orders' })
  findMine(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    return this.orders.findUserOrders(user.userId, pagination);
  }

  @Get('vendor/list')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'List orders containing the vendor items' })
  findVendor(@CurrentUser() user: AuthUser) {
    return this.orders.findVendorOrders(user.userId);
  }

  @Get('admin/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all orders (admin)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.orders.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order by id' })
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.VENDOR, Role.DELIVERY)
  @ApiOperation({
    summary: 'Update an order status (forward transitions only)',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.orders.updateStatus(id, dto.status, dto.note);
  }

  @Post(':id/cancel')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.cancel(id, user.userId);
  }

  @Post(':id/return')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Request a return for a delivered order' })
  requestReturn(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.requestReturn(id, user.userId);
  }

  @Patch(':id/assign-delivery')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a delivery partner to an order' })
  assignDelivery(@Param('id') id: string, @Body() dto: AssignDeliveryDto) {
    return this.orders.assignDelivery(id, dto.deliveryUserId);
  }
}
