import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/review.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  create(userId: string, dto: CreateReviewDto): Promise<ReviewDocument> {
    return this.reviewModel.create({
      product: dto.product,
      user: userId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  async listByProduct(
    productId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: ReviewDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.reviewModel
        .find({ product: productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments({ product: productId }).exec(),
    ]);
    return { data, total, page, limit };
  }

  async remove(
    userId: string,
    roles: string[],
    id: string,
  ): Promise<{ deleted: boolean }> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    const isAdmin = roles?.includes(Role.ADMIN);
    if (review.user.toString() !== userId && !isAdmin) {
      throw new ForbiddenException('You cannot delete this review');
    }
    await review.deleteOne();
    return { deleted: true };
  }
}
