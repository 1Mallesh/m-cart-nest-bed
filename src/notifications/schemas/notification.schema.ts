import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export type NotificationChannel = 'email' | 'sms' | 'push' | 'whatsapp';

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['email', 'sms', 'push', 'whatsapp'],
    required: true,
  })
  channel: NotificationChannel;

  @Prop({ trim: true })
  title: string;

  @Prop()
  body: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Object })
  meta?: Record<string, unknown>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ user: 1 });
