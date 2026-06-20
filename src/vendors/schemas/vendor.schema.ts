import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VendorDocument = HydratedDocument<Vendor>;

export type KycStatus = 'pending' | 'verified' | 'rejected';

@Schema({ timestamps: true })
export class Vendor {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ trim: true })
  shopName: string;

  @Prop({ trim: true })
  gstNumber: string;

  @Prop({ trim: true })
  panNumber: string;

  @Prop({ trim: true })
  bankAccount: string;

  @Prop({ trim: true })
  ifsc: string;

  @Prop({ trim: true })
  upiId?: string;

  @Prop({ type: Object })
  address: Record<string, unknown>;

  @Prop({ type: [{ type: { type: String }, url: String }], default: [] })
  documents: { type: string; url: string }[];

  @Prop({
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  })
  kycStatus: KycStatus;

  @Prop({ default: false })
  gstVerified: boolean;

  @Prop({ default: false })
  panVerified: boolean;

  @Prop({ default: 10 })
  commissionRate: number;

  @Prop({ default: false })
  isApproved: boolean;

  @Prop({ trim: true })
  rejectionReason?: string;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

VendorSchema.index({ user: 1 }, { unique: true });
VendorSchema.index({ kycStatus: 1 });
