import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { DeliveryService } from './delivery.service';
import {
  DeliveryAssignment,
  DeliveryProfileDocument,
} from './schemas/delivery-profile.schema';

type FakeProfile = Partial<DeliveryProfileDocument> & {
  id: string;
  assignments: DeliveryAssignment[];
  save: jest.Mock;
};

function makeProfile(over: Partial<FakeProfile> = {}): FakeProfile {
  return {
    id: 'p1',
    isApproved: true,
    assignments: [],
    totalDeliveries: 0,
    totalEarnings: 0,
    pendingPayout: 0,
    payouts: [],
    save: jest.fn().mockResolvedValue(undefined),
    ...over,
  } as FakeProfile;
}

describe('DeliveryService', () => {
  let service: DeliveryService;
  let model: jest.Mocked<Model<DeliveryProfileDocument>>;

  beforeEach(() => {
    model = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<Model<DeliveryProfileDocument>>;
    service = new DeliveryService(model);
  });

  const exec = (val: unknown) => ({ exec: jest.fn().mockResolvedValue(val) });

  describe('assignment lifecycle', () => {
    it('runs assign → accept → pickup → delivered and credits earnings', async () => {
      const profile = makeProfile();
      // assign() uses findById; the rest use findOne (getProfile by user).
      model.findById.mockReturnValue(exec(profile) as never);
      model.findOne.mockReturnValue(exec(profile) as never);

      await service.assign('p1', 'order-1');
      expect(profile.assignments[0]).toMatchObject({
        orderId: 'order-1',
        status: 'assigned',
      });

      await service.accept('u1', 'order-1');
      expect(profile.assignments[0].status).toBe('accepted');

      const picked = await service.markPickedUp('u1', 'order-1');
      expect(picked.otp).toMatch(/^\d{6}$/);
      expect(profile.assignments[0].status).toBe('picked_up');
      expect(profile.assignments[0].podOtpHash).toBeDefined();

      const delivered = await service.markDelivered(
        'u1',
        'order-1',
        picked.otp,
        'https://cdn/pod.jpg',
      );
      expect(delivered).toMatchObject({ ok: true, earned: 30 });
      expect(profile.assignments[0].status).toBe('delivered');
      expect(profile.assignments[0].podPhotoUrl).toBe('https://cdn/pod.jpg');
      expect(profile.totalEarnings).toBe(30);
      expect(profile.pendingPayout).toBe(30);
    });

    it('rejects delivery with a wrong OTP', async () => {
      const profile = makeProfile();
      model.findById.mockReturnValue(exec(profile) as never);
      model.findOne.mockReturnValue(exec(profile) as never);
      await service.assign('p1', 'order-1');
      await service.accept('u1', 'order-1');
      await service.markPickedUp('u1', 'order-1');

      await expect(
        service.markDelivered('u1', 'order-1', '000000'),
      ).rejects.toThrow(BadRequestException);
      expect(profile.assignments[0].status).toBe('picked_up');
    });

    it('cannot pick up before accepting', async () => {
      const profile = makeProfile({
        assignments: [{ orderId: 'order-1', status: 'assigned', earned: 0 }],
      });
      model.findOne.mockReturnValue(exec(profile) as never);
      await expect(service.markPickedUp('u1', 'order-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when the order is not assigned to the partner', async () => {
      const profile = makeProfile();
      model.findOne.mockReturnValue(exec(profile) as never);
      await expect(service.accept('u1', 'ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('runWeeklyPayout', () => {
    it('settles the pending balance into a payout record', async () => {
      const profile = makeProfile({ pendingPayout: 90 });
      model.findById.mockReturnValue(exec(profile) as never);

      await service.runWeeklyPayout('p1', 'UTR123');

      expect(profile.pendingPayout).toBe(0);
      expect(profile.lastPayoutAt).toBeInstanceOf(Date);
      expect(profile.payouts).toHaveLength(1);
      expect(profile.payouts![0]).toMatchObject({
        amount: 90,
        reference: 'UTR123',
      });
    });

    it('rejects payout when nothing is pending', async () => {
      const profile = makeProfile({ pendingPayout: 0 });
      model.findById.mockReturnValue(exec(profile) as never);
      await expect(service.runWeeklyPayout('p1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
