import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OtpEntry {
  code: string;
  expiresAt: number;
}

/**
 * In-memory OTP store (dev/mock). In production back this with Redis
 * (SETEX phone -> code) so it survives restarts and scales horizontally.
 */
@Injectable()
export class OtpService {
  private readonly store = new Map<string, OtpEntry>();
  private readonly ttlMs: number;

  constructor(config: ConfigService) {
    this.ttlMs = config.get<number>('OTP_TTL_SECONDS', 300) * 1000;
  }

  generate(phone: string, now = Date.now()): string {
    // Deterministic length, zero-padded 6-digit code.
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.store.set(phone, { code, expiresAt: now + this.ttlMs });
    return code;
  }

  verify(phone: string, code: string, now = Date.now()): boolean {
    const entry = this.store.get(phone);
    if (!entry) {
      return false;
    }
    if (entry.expiresAt < now) {
      this.store.delete(phone);
      return false;
    }
    const ok = entry.code === code;
    if (ok) {
      this.store.delete(phone);
    }
    return ok;
  }
}
