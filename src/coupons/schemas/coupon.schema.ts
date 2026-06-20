import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CouponDocument = HydratedDocument<Coupon>;

export enum CouponType {
  PERCENT = 'percent',
  FLAT = 'flat',
}

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, uppercase: true, trim: true })
  code: string;

  @Prop({ type: String, enum: CouponType, required: true })
  type: CouponType;

  @Prop({ type: Number, required: true, min: 0 })
  value: number;

  @Prop({ type: Number, default: 0 })
  minOrder: number;

  @Prop({ type: Number })
  maxDiscount?: number;

  @Prop({ type: Number })
  usageLimit?: number;

  @Prop({ type: Number, default: 0 })
  usedCount: number;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

CouponSchema.index({ code: 1 }, { unique: true });
