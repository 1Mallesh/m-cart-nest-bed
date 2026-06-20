import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WalletTransactionDocument = HydratedDocument<WalletTransaction>;

@Schema({ timestamps: true })
export class WalletTransaction {
  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  wallet: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: ['credit', 'debit'], required: true })
  type: 'credit' | 'debit';

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ required: true })
  reason: string;

  @Prop()
  reference?: string;
}

export const WalletTransactionSchema =
  SchemaFactory.createForClass(WalletTransaction);

WalletTransactionSchema.index({ wallet: 1 });
WalletTransactionSchema.index({ user: 1 });
