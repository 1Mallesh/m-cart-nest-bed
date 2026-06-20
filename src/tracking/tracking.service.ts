import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LocationPing,
  LocationPingDocument,
} from './schemas/location-ping.schema';
import { TrackingGateway } from './tracking.gateway';

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(LocationPing.name)
    private readonly pingModel: Model<LocationPingDocument>,
    private readonly gateway: TrackingGateway,
  ) {}

  async pushLocation(
    orderId: string,
    partnerId: string,
    lat: number,
    lng: number,
  ): Promise<LocationPingDocument> {
    const ping = await this.pingModel.create({
      order: new Types.ObjectId(orderId),
      deliveryPartner: new Types.ObjectId(partnerId),
      lat,
      lng,
      at: new Date(),
    });
    this.gateway.emitLocation(orderId, { lat, lng });
    return ping;
  }

  getLatest(orderId: string): Promise<LocationPingDocument | null> {
    return this.pingModel.findOne({ order: orderId }).sort({ at: -1 }).exec();
  }

  getHistory(orderId: string): Promise<LocationPingDocument[]> {
    return this.pingModel.find({ order: orderId }).sort({ at: 1 }).exec();
  }
}
