import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({ timestamps: true })
export class Brand {
  @Prop({ trim: true, required: true })
  name: string;

  @Prop({ trim: true, lowercase: true, required: true })
  slug: string;

  @Prop({ trim: true })
  logo?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.index({ slug: 1 }, { unique: true });
