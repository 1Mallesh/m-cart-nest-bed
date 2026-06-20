import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WalletDocument = HydratedDocument<Wallet>;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 'INR' })
  currency: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.index({ user: 1 }, { unique: true });
