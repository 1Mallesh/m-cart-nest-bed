import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BusDocument = HydratedDocument<Bus>;

@Schema({ timestamps: true })
export class Bus {
  @Prop({ required: true, trim: true })
  operator: string;

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

export const BusSchema = SchemaFactory.createForClass(Bus);

BusSchema.index({ from: 1, to: 1, departAt: 1 });
