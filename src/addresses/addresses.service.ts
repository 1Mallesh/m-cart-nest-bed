import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Address, AddressDocument } from './schemas/address.schema';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>,
  ) {}

  list(userId: string): Promise<AddressDocument[]> {
    return this.addressModel
      .find({ user: userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  async create(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<AddressDocument> {
    if (dto.isDefault) {
      await this.addressModel
        .updateMany({ user: userId }, { isDefault: false })
        .exec();
    }
    return this.addressModel.create({ ...dto, user: userId });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<AddressDocument> {
    if (dto.isDefault) {
      await this.addressModel
        .updateMany({ user: userId }, { isDefault: false })
        .exec();
    }
    const address = await this.addressModel
      .findOneAndUpdate({ _id: id, user: userId }, dto, { new: true })
      .exec();
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async remove(userId: string, id: string): Promise<{ deleted: boolean }> {
    const res = await this.addressModel
      .findOneAndDelete({ _id: id, user: userId })
      .exec();
    if (!res) {
      throw new NotFoundException('Address not found');
    }
    return { deleted: true };
  }

  async setDefault(userId: string, id: string): Promise<AddressDocument> {
    const address = await this.addressModel
      .findOne({ _id: id, user: userId })
      .exec();
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    await this.addressModel
      .updateMany({ user: userId }, { isDefault: false })
      .exec();
    address.isDefault = true;
    await address.save();
    return address;
  }
}
