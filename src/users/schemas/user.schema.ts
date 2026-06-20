import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ trim: true })
  name: string;

  @Prop({ lowercase: true, trim: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  // Optional: not present for OTP/Google-only accounts.
  @Prop({ select: false })
  passwordHash?: string;

  @Prop({ type: [String], enum: Role, default: [Role.CUSTOMER] })
  roles: Role[];

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: false })
  phoneVerified: boolean;

  @Prop({ sparse: true })
  googleId?: string;

  @Prop({ default: true })
  isActive: boolean;

  // Hashed current refresh token (rotation). Null when logged out.
  @Prop({ type: String, select: false, default: null })
  refreshTokenHash?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexing strategy: unique sparse indexes so multiple null emails/phones coexist.
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });
