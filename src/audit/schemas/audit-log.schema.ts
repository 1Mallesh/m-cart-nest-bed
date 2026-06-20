import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  actor?: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  entity: string;

  @Prop()
  entityId?: string;

  @Prop({ type: Object })
  meta?: Record<string, unknown>;

  @Prop()
  ip?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ action: 1 });
