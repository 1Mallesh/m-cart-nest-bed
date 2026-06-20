import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vendor, VendorDocument } from './schemas/vendor.schema';
import {
  RegisterVendorDto,
  UpdateVendorDto,
  VendorDocumentDto,
} from './dto/vendor.dto';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
  ) {}

  async register(
    userId: string,
    dto: RegisterVendorDto,
  ): Promise<VendorDocument> {
    const existing = await this.vendorModel.findOne({ user: userId }).exec();
    if (existing) {
      throw new BadRequestException('Vendor profile already exists');
    }
    return this.vendorModel.create({
      ...dto,
      user: new Types.ObjectId(userId),
      kycStatus: 'pending',
    });
  }

  async uploadDocuments(
    userId: string,
    docs: VendorDocumentDto[],
  ): Promise<VendorDocument> {
    const vendor = await this.getProfile(userId);
    vendor.documents.push(...docs);
    await vendor.save();
    return vendor;
  }

  async submitKyc(userId: string): Promise<VendorDocument> {
    const vendor = await this.getProfile(userId);
    vendor.kycStatus = 'pending';
    await vendor.save();
    return vendor;
  }

  async getProfile(userId: string): Promise<VendorDocument> {
    const vendor = await this.vendorModel.findOne({ user: userId }).exec();
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }
    return vendor;
  }

  async updateProfile(
    userId: string,
    dto: UpdateVendorDto,
  ): Promise<VendorDocument> {
    const vendor = await this.getProfile(userId);
    Object.assign(vendor, dto);
    await vendor.save();
    return vendor;
  }

  async dashboard(userId: string): Promise<Record<string, number>> {
    await this.getProfile(userId);
    // Stub counts; wire to products/orders modules when available.
    return {
      totalProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      lowStock: 0,
    };
  }

  async earnings(userId: string): Promise<Record<string, number>> {
    await this.getProfile(userId);
    // Stub totals; wire to payouts/orders modules when available.
    return {
      totalEarnings: 0,
      pendingPayout: 0,
      commissionDeducted: 0,
    };
  }

  async approve(vendorId: string): Promise<VendorDocument> {
    const vendor = await this.findById(vendorId);
    vendor.isApproved = true;
    vendor.kycStatus = 'verified';
    vendor.rejectionReason = undefined;
    await vendor.save();
    return vendor;
  }

  async reject(vendorId: string, reason: string): Promise<VendorDocument> {
    const vendor = await this.findById(vendorId);
    vendor.isApproved = false;
    vendor.kycStatus = 'rejected';
    vendor.rejectionReason = reason;
    await vendor.save();
    return vendor;
  }

  async verifyGstPan(vendorId: string): Promise<VendorDocument> {
    const vendor = await this.findById(vendorId);
    // Mock verification: validate formats only. Replace with GSTN/NSDL APIs.
    if (!GST_REGEX.test(vendor.gstNumber)) {
      throw new BadRequestException('Invalid GST number format');
    }
    if (!PAN_REGEX.test(vendor.panNumber)) {
      throw new BadRequestException('Invalid PAN number format');
    }
    vendor.gstVerified = true;
    vendor.panVerified = true;
    await vendor.save();
    return vendor;
  }

  private async findById(vendorId: string): Promise<VendorDocument> {
    const vendor = await this.vendorModel.findById(vendorId).exec();
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }
}
