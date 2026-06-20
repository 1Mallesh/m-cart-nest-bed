import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Model } from 'mongoose';
import { PaymentsService } from './payments.service';
import { PaymentDocument } from './schemas/payment.schema';

const exec = (val: unknown) => ({ exec: jest.fn().mockResolvedValue(val) });

describe('PaymentsService', () => {
  let service: PaymentsService;
  let model: jest.Mocked<Model<PaymentDocument>>;
  const config = {
    // No real keys → service uses the deterministic mock order id.
    get: jest.fn((key: string, def?: unknown) => def),
  } as unknown as ConfigService;

  beforeEach(() => {
    model = {
      create: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<Model<PaymentDocument>>;
    service = new PaymentsService(model, config);
  });

  describe('createOrder (mock fallback)', () => {
    it('derives a deterministic providerOrderId from the payment id', async () => {
      const payment: any = {
        _id: { toString: () => 'pay1' },
        amount: 500,
        currency: 'INR',
        save: jest.fn().mockResolvedValue(undefined),
      };
      model.create.mockResolvedValue(payment as never);

      const res = await service.createOrder('665f1a2b3c4d5e6f7a8b9c0e', {
        orderId: '665f1a2b3c4d5e6f7a8b9c0d',
        amount: 500,
      });

      expect(res.providerOrderId).toBe('order_pay1');
      expect(res.amount).toBe(500);
      expect(payment.save).toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('accepts a valid HMAC signature and marks paid', async () => {
      const payment: any = {
        _id: { toString: () => 'pay1' },
        save: jest.fn().mockResolvedValue(undefined),
      };
      model.findOne.mockReturnValue(exec(payment) as never);
      const sig = crypto
        .createHmac('sha256', 'test_secret')
        .update('order_x|pay_x')
        .digest('hex');

      const res = await service.verify({
        providerOrderId: 'order_x',
        providerPaymentId: 'pay_x',
        signature: sig,
      });

      expect(res.success).toBe(true);
      expect(payment.status).toBe('paid');
    });

    it('rejects an invalid signature', async () => {
      model.findOne.mockReturnValue(exec({ save: jest.fn() }) as never);
      await expect(
        service.verify({
          providerOrderId: 'order_x',
          providerPaymentId: 'pay_x',
          signature: 'deadbeef',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFound when payment missing', async () => {
      model.findOne.mockReturnValue(exec(null) as never);
      await expect(
        service.verify({
          providerOrderId: 'nope',
          providerPaymentId: 'p',
          signature: 's',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('refund', () => {
    it('refunds a paid payment', async () => {
      const payment: any = {
        status: 'paid',
        amount: 100,
        save: jest.fn().mockImplementation(function (this: any) {
          return this;
        }),
      };
      model.findById.mockReturnValue(exec(payment) as never);
      const res = await service.refund('p1');
      expect(res.status).toBe('refunded');
    });

    it('rejects refunding an unpaid payment', async () => {
      model.findById.mockReturnValue(
        exec({ status: 'created', amount: 100 }) as never,
      );
      await expect(service.refund('p1')).rejects.toThrow(BadRequestException);
    });
  });
});
