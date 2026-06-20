import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ListReviewsQueryDto } from './dto/review.dto';

@ApiTags('reviews')
@Controller({ path: 'reviews', version: '1' })
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a product review' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List reviews for a product (public)' })
  list(@Query() query: ListReviewsQueryDto) {
    return this.reviews.listByProduct(
      query.productId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a review (owner or admin)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reviews.remove(user.userId, user.roles, id);
  }
}
