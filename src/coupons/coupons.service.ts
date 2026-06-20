import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument, CouponType } from './schemas/coupon.schema';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
  ) {}

  create(dto: CreateCouponDto): Promise<CouponDocument> {
    return this.couponModel.create({ ...dto, code: dto.code.toUpperCase() });
  }

  findAll(): Promise<CouponDocument[]> {
    return this.couponModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<CouponDocument> {
    const coupon = await this.couponModel.findById(id).exec();
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponDocument> {
    const update: Record<string, unknown> = { ...dto };
    if (dto.code) {
      update.code = dto.code.toUpperCase();
    }
    const coupon = await this.couponModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.couponModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Coupon not found');
    }
    return { deleted: true };
  }

  async validate(
    code: string,
    orderAmount: number,
  ): Promise<{ code: string; discount: number; payable: number }> {
    const coupon = await this.couponModel
      .findOne({ code: code.toUpperCase() })
      .exec();
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid coupon');
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Coupon has expired');
    }
    if (
      coupon.usageLimit !== undefined &&
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (orderAmount < coupon.minOrder) {
      throw new BadRequestException(
        `Order amount must be at least ${coupon.minOrder}`,
      );
    }

    let discount =
      coupon.type === CouponType.PERCENT
        ? (orderAmount * coupon.value) / 100
        : coupon.value;

    if (coupon.maxDiscount !== undefined && coupon.maxDiscount !== null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    discount = Math.min(discount, orderAmount);

    return {
      code: coupon.code,
      discount,
      payable: orderAmount - discount,
    };
  }
}
