import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
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
import { ProductsService } from './products.service';
import {
  BulkUploadProductDto,
  CreateProductDto,
  FindProductsQueryDto,
  RejectProductDto,
  UpdateProductDto,
} from './dto/product.dto';

@ApiTags('products')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a product (VENDOR) — starts as pending' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.products.create(user.userId, dto);
  }

  @Post('bulk-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Bulk upload products (VENDOR)' })
  bulkUpload(@CurrentUser() user: AuthUser, @Body() dto: BulkUploadProductDto) {
    return this.products.bulkUpload(user.userId, dto.products);
  }

  @Get()
  @ApiOperation({ summary: 'List approved products (public, paginated)' })
  findAll(@Query() query: FindProductsQueryDto) {
    return this.products.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id (public)' })
  findOne(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a product (VENDOR/ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a product (VENDOR/ADMIN)' })
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve a product (ADMIN)' })
  approve(@Param('id') id: string) {
    return this.products.approve(id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reject a product with a reason (ADMIN)' })
  reject(@Param('id') id: string, @Body() dto: RejectProductDto) {
    return this.products.reject(id, dto.reason);
  }
}
