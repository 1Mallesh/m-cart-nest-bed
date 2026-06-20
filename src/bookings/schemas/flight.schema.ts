import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FlightDocument = HydratedDocument<Flight>;

@Schema({ timestamps: true })
export class Flight {
  @Prop({ required: true, trim: true })
  flightNumber: string;

  @Prop({ required: true, trim: true })
  airline: string;

  @Prop({ required: true, trim: true })
  from: string;

  @Prop({ required: true, trim: true })
  to: string;

  @Prop({ type: Date, required: true })
  departAt: Date;

  @Prop({ type: Date, required: true })
  arriveAt: Date;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, default: 0 })
  seatsAvailable: number;
}

export const FlightSchema = SchemaFactory.createForClass(Flight);

FlightSchema.index({ from: 1, to: 1, departAt: 1 });
