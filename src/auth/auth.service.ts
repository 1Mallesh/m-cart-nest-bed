import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthTokensDto } from './dto/auth.dto';
import { Msg91Service } from './msg91.service';
import { OtpService } from './otp.service';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
    private readonly msg91: Msg91Service,
  ) {}

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthTokensDto> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.users.create({
      name,
      email,
      passwordHash,
      roles: [Role.CUSTOMER],
    });
    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<AuthTokensDto> {
    const user = await this.users.findByEmail(email, true);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user);
  }

  async requestOtp(
    phone: string,
  ): Promise<{ sent: boolean; devCode?: string }> {
    // When MSG91 is configured, it generates and SMSes the OTP for us.
    if (this.msg91.enabled) {
      await this.msg91.sendOtp(phone);
      return { sent: true };
    }
    // Fallback (dev/local): generate locally and surface the code.
    const code = this.otp.generate(phone);
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';
    return { sent: true, ...(isDev ? { devCode: code } : {}) };
  }

  async resendOtp(phone: string): Promise<{ sent: boolean; devCode?: string }> {
    if (this.msg91.enabled) {
      await this.msg91.resendOtp(phone);
      return { sent: true };
    }
    // Fallback: regenerate a fresh code.
    const code = this.otp.generate(phone);
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';
    return { sent: true, ...(isDev ? { devCode: code } : {}) };
  }

  async verifyOtp(phone: string, code: string): Promise<AuthTokensDto> {
    const ok = this.msg91.enabled
      ? await this.msg91.verifyOtp(phone, code)
      : this.otp.verify(phone, code);
    if (!ok) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    let user = await this.users.findByPhone(phone);
    if (!user) {
      user = await this.users.create({
        phone,
        phoneVerified: true,
        roles: [Role.CUSTOMER],
      });
    }
    return this.issueTokens(user);
  }

  /**
   * Google login. NOTE: in production verify `idToken` against Google's
   * public keys (google-auth-library). Here we accept a pre-verified email
   * to keep the module provider-agnostic and unit-testable.
   */
  async googleLogin(
    email: string,
    googleId: string,
    name?: string,
  ): Promise<AuthTokensDto> {
    let user = await this.users.findByGoogleId(googleId);
    if (!user) {
      user = await this.users.findByEmail(email);
    }
    if (!user) {
      user = await this.users.create({
        name,
        email,
        googleId,
        emailVerified: true,
        roles: [Role.CUSTOMER],
      });
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.users.findByIdWithRefresh(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Session expired');
    }
    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.users.setRefreshTokenHash(userId, null);
  }

  private async issueTokens(user: UserDocument): Promise<AuthTokensDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '900s'),
    });
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '7d'),
      },
    );
    const refreshHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.users.setRefreshTokenHash(user.id, refreshHash);
    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }
}
