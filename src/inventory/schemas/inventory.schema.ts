import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InventoryDocument = HydratedDocument<Inventory>;

@Schema({ timestamps: true })
export class Inventory {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ default: 0 })
  quantity: number;

  @Prop({ default: 0 })
  reserved: number;

  @Prop({ default: 5 })
  lowStockThreshold: number;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

InventorySchema.index({ product: 1 }, { unique: true });
