import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeliveryProfileDocument = HydratedDocument<DeliveryProfile>;

export type KycStatus = 'pending' | 'verified' | 'rejected';
export type AssignmentStatus =
  | 'assigned'
  | 'accepted'
  | 'picked_up'
  | 'delivered'
  | 'failed';

// Embedded per-order delivery lifecycle (FR-DEL-02/03/04).
@Schema({ _id: false, timestamps: true })
export class DeliveryAssignment {
  @Prop({ required: true })
  orderId: string;

  @Prop({
    type: String,
    enum: ['assigned', 'accepted', 'picked_up', 'delivered', 'failed'],
    default: 'assigned',
  })
  status: AssignmentStatus;

  // Proof-of-delivery OTP (FR-DEL-04). Stored hashed; sent to the customer.
  @Prop()
  podOtpHash?: string;

  @Prop()
  podPhotoUrl?: string;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  failureReason?: string;

  @Prop({ default: 0 })
  earned: number;
}

export const DeliveryAssignmentSchema =
  SchemaFactory.createForClass(DeliveryAssignment);

// Weekly payout record (FR-DEL-05).
@Schema({ _id: false, timestamps: true })
export class DeliveryPayout {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  periodStart: Date;

  @Prop({ required: true })
  periodEnd: Date;

  @Prop({ default: 0 })
  deliveries: number;

  @Prop({ trim: true })
  reference?: string; // payout txn reference (Razorpay/UPI)
}

export const DeliveryPayoutSchema =
  SchemaFactory.createForClass(DeliveryPayout);

// GeoJSON point for proximity-based assignment (FR-DEL-02/06).
@Schema({ _id: false })
export class GeoPoint {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: 'Point';

  @Prop({ type: [Number], default: [0, 0] }) // [lng, lat]
  coordinates: number[];
}

export const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

@Schema({ timestamps: true })
export class DeliveryProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  // --- KYC / onboarding ---
  @Prop({ trim: true })
  fullName?: string;

  @Prop({ trim: true })
  aadhaarNumber?: string;

  @Prop({ trim: true })
  panNumber?: string;

  @Prop({ trim: true })
  drivingLicense?: string;

  // --- bank details ---
  @Prop({ trim: true })
  bankAccount?: string;

  @Prop({ trim: true })
  ifsc?: string;

  @Prop({ trim: true })
  upiId?: string;

  // --- vehicle details ---
  @Prop({ trim: true })
  vehicleType?: string; // bike, scooter, ev, etc.

  @Prop({ trim: true })
  vehicleNumber?: string;

  @Prop({ trim: true })
  zone?: string; // operating zone / pincode area

  @Prop({ type: [{ type: { type: String }, url: String }], default: [] })
  documents: { type: string; url: string }[];

  @Prop({
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  })
  kycStatus: KycStatus;

  @Prop({ default: false })
  isApproved: boolean;

  @Prop({ trim: true })
  rejectionReason?: string;

  // --- assignments (FR-DEL-02/03/04) ---
  @Prop({ type: [DeliveryAssignmentSchema], default: [] })
  assignments: DeliveryAssignment[];

  // --- earnings & payouts (FR-DEL-05) ---
  @Prop({ default: 0 })
  totalEarnings: number;

  @Prop({ default: 0 })
  totalDeliveries: number;

  @Prop({ default: 0 })
  pendingPayout: number;

  @Prop({ type: [DeliveryPayoutSchema], default: [] })
  payouts: DeliveryPayout[];

  @Prop()
  lastPayoutAt?: Date;

  // --- live status ---
  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  currentLat?: number;

  @Prop()
  currentLng?: number;

  // GeoJSON point for proximity-based assignment (FR-DEL-02/06).
  @Prop({ type: GeoPointSchema, default: () => ({}) })
  location: GeoPoint;

  @Prop({ default: true })
  isAvailable: boolean;
}

export const DeliveryProfileSchema =
  SchemaFactory.createForClass(DeliveryProfile);

DeliveryProfileSchema.index({ user: 1 }, { unique: true });
DeliveryProfileSchema.index({ kycStatus: 1 });
DeliveryProfileSchema.index({ isOnline: 1, isAvailable: 1 });
DeliveryProfileSchema.index({ zone: 1 });
DeliveryProfileSchema.index({ location: '2dsphere' });
