import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BookingStatus } from './flight-booking.schema';

export type BusBookingDocument = HydratedDocument<BusBooking>;

@Schema({ timestamps: true })
export class BusBooking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Bus', required: true })
  bus: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  seats: string[];

  @Prop({ required: true, unique: true })
  pnr: string;

  @Prop({ type: String, enum: ['booked', 'cancelled'], default: 'booked' })
  status: BookingStatus;

  @Prop({ required: true })
  amount: number;
}

export const BusBookingSchema = SchemaFactory.createForClass(BusBooking);

BusBookingSchema.index({ user: 1 });
