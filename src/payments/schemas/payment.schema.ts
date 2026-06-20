import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: ['razorpay', 'upi', 'cod'], required: true })
  provider: 'razorpay' | 'upi' | 'cod';

  @Prop()
  providerOrderId?: string;

  @Prop()
  providerPaymentId?: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({
    type: String,
    enum: ['created', 'paid', 'failed', 'refunded'],
    default: 'created',
  })
  status: 'created' | 'paid' | 'failed' | 'refunded';

  @Prop()
  signature?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ order: 1 });
PaymentSchema.index({ status: 1 });
