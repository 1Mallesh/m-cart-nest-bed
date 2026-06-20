import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Model, Types } from 'mongoose';
import Razorpay from 'razorpay';
import { Payment, PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly razorpay?: Razorpay;

  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    private readonly config: ConfigService,
  ) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    // Only init the real client when real-looking keys are supplied.
    if (
      keyId &&
      keySecret &&
      keyId.startsWith('rzp_') &&
      keySecret !== 'your_test_secret_here'
    ) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } else {
      this.logger.warn(
        'Razorpay keys not configured — using local mock order ids (dev only).',
      );
    }
  }

  async createOrder(
    userId: string,
    input: { orderId: string; amount: number },
  ): Promise<{
    paymentId: string;
    providerOrderId: string;
    amount: number;
    currency: string;
    key: string;
  }> {
    const payment = await this.paymentModel.create({
      order: new Types.ObjectId(input.orderId),
      user: new Types.ObjectId(userId),
      provider: 'razorpay',
      amount: input.amount,
      currency: 'INR',
      status: 'created',
    });

    let providerOrderId: string;
    if (this.razorpay) {
      // Razorpay works in the smallest currency unit (paise).
      const rzpOrder = await this.razorpay.orders.create({
        amount: Math.round(input.amount * 100),
        currency: 'INR',
        receipt: payment._id.toString(),
      });
      providerOrderId = rzpOrder.id;
    } else {
      // Dev fallback: deterministic id derived from the mongoose _id.
      providerOrderId = `order_${payment._id.toString()}`;
    }
    payment.providerOrderId = providerOrderId;
    await payment.save();
    return {
      paymentId: payment._id.toString(),
      providerOrderId,
      amount: payment.amount,
      currency: payment.currency,
      key: this.config.get<string>('RAZORPAY_KEY_ID', 'rzp_test_xxx'),
    };
  }

  async verify(input: {
    providerOrderId: string;
    providerPaymentId: string;
    signature: string;
  }): Promise<{ success: true; paymentId: string }> {
    const payment = await this.paymentModel
      .findOne({ providerOrderId: input.providerOrderId })
      .exec();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    const secret = this.config.get<string>(
      'RAZORPAY_KEY_SECRET',
      'test_secret',
    );
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${input.providerOrderId}|${input.providerPaymentId}`)
      .digest('hex');
    const matches =
      expected.length === input.signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(input.signature),
      );
    if (!matches) {
      throw new BadRequestException('Invalid payment signature');
    }
    payment.status = 'paid';
    payment.providerPaymentId = input.providerPaymentId;
    payment.signature = input.signature;
    await payment.save();
    return { success: true, paymentId: payment._id.toString() };
  }

  async handleWebhook(payload: {
    providerOrderId?: string;
    status?: Payment['status'];
  }): Promise<{ received: true }> {
    if (payload.providerOrderId && payload.status) {
      await this.paymentModel
        .updateOne(
          { providerOrderId: payload.providerOrderId },
          { status: payload.status },
        )
        .exec();
    }
    return { received: true };
  }

  async refund(paymentId: string, amount?: number): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findById(paymentId).exec();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status !== 'paid') {
      throw new BadRequestException('Only paid payments can be refunded');
    }
    if (amount !== undefined && amount > payment.amount) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }
    payment.status = 'refunded';
    return payment.save();
  }

  async codConfirm(userId: string, orderId: string): Promise<PaymentDocument> {
    const existing = await this.paymentModel
      .findOne({ order: new Types.ObjectId(orderId), provider: 'cod' })
      .exec();
    if (existing) {
      existing.status = 'paid';
      return existing.save();
    }
    return this.paymentModel.create({
      order: new Types.ObjectId(orderId),
      user: new Types.ObjectId(userId),
      provider: 'cod',
      amount: 0,
      currency: 'INR',
      status: 'paid',
    });
  }
}
