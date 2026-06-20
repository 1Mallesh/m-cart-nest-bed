import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LocationPingDocument = HydratedDocument<LocationPing>;

@Schema({ timestamps: true })
export class LocationPing {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  deliveryPartner: Types.ObjectId;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ type: Date, required: true })
  at: Date;
}

export const LocationPingSchema = SchemaFactory.createForClass(LocationPing);

LocationPingSchema.index({ order: 1 });
