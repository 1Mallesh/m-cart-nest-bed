import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FeatureFlagDocument = HydratedDocument<FeatureFlag>;

@Schema({ timestamps: true })
export class FeatureFlag {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ default: false })
  enabled: boolean;

  @Prop()
  description?: string;

  // Optional gradual rollout percentage (0-100).
  @Prop({ default: 100, min: 0, max: 100 })
  rolloutPercentage: number;
}

export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);
