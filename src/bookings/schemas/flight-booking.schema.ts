import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FlightBookingDocument = HydratedDocument<FlightBooking>;

export type BookingStatus = 'booked' | 'cancelled';

@Schema({ timestamps: true })
export class FlightBooking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Flight', required: true })
  flight: Types.ObjectId;

  @Prop({
    type: [{ name: String, age: Number, seat: String }],
    default: [],
  })
  passengers: { name: string; age: number; seat?: string }[];

  @Prop({ required: true, unique: true })
  pnr: string;

  @Prop({ type: String, enum: ['booked', 'cancelled'], default: 'booked' })
  status: BookingStatus;

  @Prop({ required: true })
  amount: number;
}

export const FlightBookingSchema = SchemaFactory.createForClass(FlightBooking);

FlightBookingSchema.index({ user: 1 });
