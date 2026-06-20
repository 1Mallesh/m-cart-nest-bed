import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  DeliveryAssignment,
  DeliveryProfile,
  DeliveryProfileDocument,
} from './schemas/delivery-profile.schema';
import {
  DeliveryDocumentDto,
  RegisterDeliveryDto,
  UpdateDeliveryProfileDto,
} from './dto/delivery.dto';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAAR_REGEX = /^\d{4}\s?\d{4}\s?\d{4}$/;
const PAYOUT_PER_DELIVERY = 30; // flat earning per completed delivery (₹)
const NEAREST_AGENT_MAX_METERS = 7000; // proximity radius for auto-assign

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(DeliveryProfile.name)
    private readonly profileModel: Model<DeliveryProfileDocument>,
  ) {}

  async getOrCreate(userId: string): Promise<DeliveryProfileDocument> {
    const existing = await this.profileModel.findOne({ user: userId }).exec();
    if (existing) {
      return existing;
    }
    return this.profileModel.create({ user: new Types.ObjectId(userId) });
  }

  // --- onboarding / KYC ---

  async register(
    userId: string,
    dto: RegisterDeliveryDto,
  ): Promise<DeliveryProfileDocument> {
    const profile = await this.getOrCreate(userId);
    if (profile.isApproved) {
      throw new BadRequestException('Delivery profile already approved');
    }
    Object.assign(profile, dto);
    profile.kycStatus = 'pending';
    await profile.save();
    return profile;
  }

  async uploadDocuments(
    userId: string,
    docs: DeliveryDocumentDto[],
  ): Promise<DeliveryProfileDocument> {
    const profile = await this.getProfile(userId);
    profile.documents.push(...docs);
    await profile.save();
    return profile;
  }

  async submitKyc(userId: string): Promise<DeliveryProfileDocument> {
    const profile = await this.getProfile(userId);
    if (!profile.aadhaarNumber || !profile.drivingLicense) {
      throw new BadRequestException(
        'Complete onboarding (Aadhaar + driving licence) before submitting KYC',
      );
    }
    profile.kycStatus = 'pending';
    await profile.save();
    return profile;
  }

  async getProfile(userId: string): Promise<DeliveryProfileDocument> {
    const profile = await this.profileModel.findOne({ user: userId }).exec();
    if (!profile) {
      throw new NotFoundException('Delivery profile not found');
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    dto: UpdateDeliveryProfileDto,
  ): Promise<DeliveryProfileDocument> {
    const profile = await this.getProfile(userId);
    Object.assign(profile, dto);
    await profile.save();
    return profile;
  }

  async earnings(userId: string): Promise<Record<string, number>> {
    const profile = await this.getProfile(userId);
    return {
      totalEarnings: profile.totalEarnings,
      totalDeliveries: profile.totalDeliveries,
      pendingPayout: profile.pendingPayout,
    };
  }

  // --- live status ---

  async goOnline(userId: string): Promise<DeliveryProfileDocument> {
    const profile = await this.requireApproved(userId);
    profile.isOnline = true;
    await profile.save();
    return profile;
  }

  async goOffline(userId: string): Promise<DeliveryProfileDocument> {
    const profile = await this.getOrCreate(userId);
    profile.isOnline = false;
    await profile.save();
    return profile;
  }

  async updateLocation(
    userId: string,
    lat: number,
    lng: number,
  ): Promise<DeliveryProfileDocument> {
    const profile = await this.getOrCreate(userId);
    profile.currentLat = lat;
    profile.currentLng = lng;
    profile.location = { type: 'Point', coordinates: [lng, lat] };
    await profile.save();
    return profile;
  }

  // --- assignments (FR-DEL-02/03/04) ---

  async listAssignedOrders(userId: string): Promise<DeliveryAssignment[]> {
    const profile = await this.requireApproved(userId);
    // Active = anything not yet completed/failed.
    return profile.assignments.filter(
      (a) => a.status !== 'delivered' && a.status !== 'failed',
    );
  }

  /** Admin / system: assign an order to a specific partner. */
  async assign(
    profileId: string,
    orderId: string,
  ): Promise<DeliveryProfileDocument> {
    const profile = await this.findById(profileId);
    if (!profile.isApproved) {
      throw new BadRequestException('Partner not approved');
    }
    if (profile.assignments.some((a) => a.orderId === orderId)) {
      throw new BadRequestException('Order already assigned to this partner');
    }
    profile.assignments.push({
      orderId,
      status: 'assigned',
      earned: 0,
    } as DeliveryAssignment);
    await profile.save();
    return profile;
  }

  /**
   * System: assign an order to the nearest available, online partner
   * (FR-DEL-02 proximity-based auto-assign, FR-DEL-06 zone-aware).
   */
  async autoAssign(
    orderId: string,
    lat: number,
    lng: number,
    zone?: string,
  ): Promise<DeliveryProfileDocument> {
    const query: Record<string, unknown> = {
      isApproved: true,
      isOnline: true,
      isAvailable: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: NEAREST_AGENT_MAX_METERS,
        },
      },
    };
    if (zone) {
      query.zone = zone;
    }
    const nearest = await this.profileModel.findOne(query).exec();
    if (!nearest) {
      throw new NotFoundException(
        'No available delivery partner near the pickup location',
      );
    }
    return this.assign(nearest.id, orderId);
  }

  async accept(
    userId: string,
    orderId: string,
  ): Promise<{ ok: boolean; orderId: string; status: string }> {
    const profile = await this.requireApproved(userId);
    const assignment = this.requireAssignment(profile, orderId);
    if (assignment.status !== 'assigned') {
      throw new BadRequestException(
        `Cannot accept an order in "${assignment.status}" state`,
      );
    }
    assignment.status = 'accepted';
    await profile.save();
    return { ok: true, orderId, status: assignment.status };
  }

  /**
   * Confirm pickup and issue a proof-of-delivery OTP (FR-DEL-04). The plain
   * OTP is returned here so it can be relayed to the customer; only its hash
   * is persisted.
   */
  async markPickedUp(
    userId: string,
    orderId: string,
  ): Promise<{ ok: boolean; orderId: string; status: string; otp: string }> {
    const profile = await this.requireApproved(userId);
    const assignment = this.requireAssignment(profile, orderId);
    if (assignment.status !== 'accepted') {
      throw new BadRequestException(
        `Accept the order before pickup (current: "${assignment.status}")`,
      );
    }
    const otp = this.generateOtp();
    assignment.podOtpHash = await bcrypt.hash(otp, 8);
    assignment.status = 'picked_up';
    await profile.save();
    // Stub: transition order to OUT_FOR_DELIVERY and SMS the OTP to the
    // customer via the orders/notifications modules.
    return { ok: true, orderId, status: assignment.status, otp };
  }

  /**
   * Complete delivery with proof (OTP + optional photo) and credit earnings
   * (FR-DEL-04/05).
   */
  async markDelivered(
    userId: string,
    orderId: string,
    otp: string,
    photoUrl?: string,
  ): Promise<{ ok: boolean; orderId: string; earned: number }> {
    const profile = await this.requireApproved(userId);
    const assignment = this.requireAssignment(profile, orderId);
    if (assignment.status !== 'picked_up') {
      throw new BadRequestException(
        `Order must be picked up before delivery (current: "${assignment.status}")`,
      );
    }
    if (
      !assignment.podOtpHash ||
      !(await bcrypt.compare(otp, assignment.podOtpHash))
    ) {
      throw new BadRequestException('Invalid delivery OTP');
    }
    assignment.status = 'delivered';
    assignment.deliveredAt = new Date();
    assignment.podPhotoUrl = photoUrl;
    assignment.podOtpHash = undefined;
    assignment.earned = PAYOUT_PER_DELIVERY;

    profile.totalDeliveries += 1;
    profile.totalEarnings += PAYOUT_PER_DELIVERY;
    profile.pendingPayout += PAYOUT_PER_DELIVERY;
    await profile.save();
    // Stub: mark the order DELIVERED via the orders module.
    return { ok: true, orderId, earned: PAYOUT_PER_DELIVERY };
  }

  // --- admin ---

  /**
   * Settle the partner's pending payout for the week (FR-DEL-05). Records a
   * payout entry and resets the pending balance.
   */
  async runWeeklyPayout(
    profileId: string,
    reference?: string,
  ): Promise<DeliveryProfileDocument> {
    const profile = await this.findById(profileId);
    if (profile.pendingPayout <= 0) {
      throw new BadRequestException('No pending payout to settle');
    }
    const periodEnd = new Date();
    const periodStart = profile.lastPayoutAt
      ? profile.lastPayoutAt
      : new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const deliveries = profile.assignments.filter(
      (a) =>
        a.status === 'delivered' &&
        a.deliveredAt &&
        a.deliveredAt > periodStart &&
        a.deliveredAt <= periodEnd,
    ).length;

    profile.payouts.push({
      amount: profile.pendingPayout,
      periodStart,
      periodEnd,
      deliveries,
      reference,
    });
    profile.pendingPayout = 0;
    profile.lastPayoutAt = periodEnd;
    await profile.save();
    return profile;
  }

  async approve(profileId: string): Promise<DeliveryProfileDocument> {
    const profile = await this.findById(profileId);
    profile.isApproved = true;
    profile.kycStatus = 'verified';
    profile.rejectionReason = undefined;
    await profile.save();
    return profile;
  }

  async reject(
    profileId: string,
    reason: string,
  ): Promise<DeliveryProfileDocument> {
    const profile = await this.findById(profileId);
    profile.isApproved = false;
    profile.kycStatus = 'rejected';
    profile.rejectionReason = reason;
    await profile.save();
    return profile;
  }

  async verifyKyc(profileId: string): Promise<DeliveryProfileDocument> {
    const profile = await this.findById(profileId);
    // Mock verification: format checks only. Replace with UIDAI/NSDL APIs.
    if (profile.panNumber && !PAN_REGEX.test(profile.panNumber)) {
      throw new BadRequestException('Invalid PAN number format');
    }
    if (profile.aadhaarNumber && !AADHAAR_REGEX.test(profile.aadhaarNumber)) {
      throw new BadRequestException('Invalid Aadhaar number format');
    }
    profile.kycStatus = 'verified';
    await profile.save();
    return profile;
  }

  // --- helpers ---

  private async requireApproved(
    userId: string,
  ): Promise<DeliveryProfileDocument> {
    const profile = await this.getProfile(userId);
    if (!profile.isApproved) {
      throw new BadRequestException(
        'Delivery profile not yet approved by admin',
      );
    }
    return profile;
  }

  private async findById(profileId: string): Promise<DeliveryProfileDocument> {
    const profile = await this.profileModel.findById(profileId).exec();
    if (!profile) {
      throw new NotFoundException('Delivery profile not found');
    }
    return profile;
  }

  private requireAssignment(
    profile: DeliveryProfileDocument,
    orderId: string,
  ): DeliveryAssignment {
    const assignment = profile.assignments.find((a) => a.orderId === orderId);
    if (!assignment) {
      throw new NotFoundException('Order not assigned to this partner');
    }
    return assignment;
  }

  private generateOtp(): string {
    // 6-digit numeric OTP (mock POD; replace delivery channel as needed).
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
