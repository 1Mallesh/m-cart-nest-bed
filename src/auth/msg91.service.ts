import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * MSG91 OTP integration (https://docs.msg91.com/otp).
 *
 * Uses MSG91's hosted OTP API directly over HTTPS (no SDK dependency):
 *   - send:   POST  https://control.msg91.com/api/v5/otp
 *   - verify: GET   https://control.msg91.com/api/v5/otp/verify
 *   - resend: GET   https://control.msg91.com/api/v5/otp/retry
 *
 * MSG91 generates and validates the code on its side, so we don't store
 * codes ourselves. When MSG91_AUTH_KEY is not configured the service is
 * "disabled" and the caller falls back to the local in-memory OtpService.
 *
 * Enterprise hardening: per-request timeout (AbortController), bounded
 * retry-with-backoff on transient failures, structured logging, and typed
 * exceptions so the API layer returns a clean 503 instead of leaking errors.
 */
@Injectable()
export class Msg91Service {
  private readonly logger = new Logger(Msg91Service.name);
  private readonly baseUrl = 'https://control.msg91.com/api/v5/otp';
  private readonly authKey?: string;
  private readonly templateId?: string;
  private readonly senderId?: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(config: ConfigService) {
    this.authKey = config.get<string>('MSG91_AUTH_KEY');
    this.templateId = config.get<string>('MSG91_TEMPLATE_ID');
    this.senderId = config.get<string>('MSG91_SENDER_ID');
    this.timeoutMs = config.get<number>('MSG91_TIMEOUT_MS', 8000);
    this.maxRetries = config.get<number>('MSG91_MAX_RETRIES', 2);
  }

  /** True when credentials are present and real SMS can be dispatched. */
  get enabled(): boolean {
    return Boolean(this.authKey && this.templateId);
  }

  /** MSG91 expects the mobile with country code and no '+' (e.g. 919876543210). */
  private normalize(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }

  /**
   * fetch wrapper: enforces a timeout and retries transient failures
   * (network errors, 429, 5xx) with exponential backoff. 4xx responses
   * are returned as-is so callers can distinguish "bad OTP" from outages.
   */
  private async request(
    url: string,
    init: RequestInit,
    attempt = 0,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (res.status === 429 || res.status >= 500) {
        if (attempt < this.maxRetries) {
          return this.backoffRetry(url, init, attempt, `HTTP ${res.status}`);
        }
      }
      return res;
    } catch (err) {
      if (attempt < this.maxRetries) {
        return this.backoffRetry(url, init, attempt, (err as Error).message);
      }
      this.logger.error(
        `MSG91 request failed after ${attempt + 1} attempts: ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException('SMS provider unavailable');
    } finally {
      clearTimeout(timer);
    }
  }

  private async backoffRetry(
    url: string,
    init: RequestInit,
    attempt: number,
    reason: string,
  ): Promise<Response> {
    const delay = 250 * 2 ** attempt;
    this.logger.warn(
      `MSG91 retry ${attempt + 1}/${this.maxRetries} after ${delay}ms (${reason})`,
    );
    await new Promise((r) => setTimeout(r, delay));
    return this.request(url, init, attempt + 1);
  }

  /** Ask MSG91 to generate and SMS an OTP to the given phone. */
  async sendOtp(phone: string): Promise<void> {
    const params = new URLSearchParams({
      template_id: this.templateId as string,
      mobile: this.normalize(phone),
      authkey: this.authKey as string,
    });
    if (this.senderId) {
      params.set('sender', this.senderId);
    }
    const res = await this.request(`${this.baseUrl}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = (await res.json().catch(() => ({}))) as {
      type?: string;
      message?: string;
    };
    if (!res.ok || body.type !== 'success') {
      this.logger.error(`MSG91 sendOtp failed: ${JSON.stringify(body)}`);
      throw new ServiceUnavailableException(
        body.message || 'Failed to send OTP via MSG91',
      );
    }
    this.logger.log(`OTP dispatched via MSG91 to ${this.maskPhone(phone)}`);
  }

  /** Resend an OTP (MSG91 retry endpoint). channel: 'text' | 'voice'. */
  async resendOtp(
    phone: string,
    channel: 'text' | 'voice' = 'text',
  ): Promise<void> {
    const params = new URLSearchParams({
      mobile: this.normalize(phone),
      retrytype: channel,
    });
    const res = await this.request(
      `${this.baseUrl}/retry?${params.toString()}`,
      {
        method: 'GET',
        headers: { authkey: this.authKey as string },
      },
    );
    const body = (await res.json().catch(() => ({}))) as {
      type?: string;
      message?: string;
    };
    if (!res.ok || body.type !== 'success') {
      this.logger.error(`MSG91 resendOtp failed: ${JSON.stringify(body)}`);
      throw new ServiceUnavailableException(
        body.message || 'Failed to resend OTP via MSG91',
      );
    }
  }

  /** Verify a code with MSG91. Returns true when MSG91 accepts the OTP. */
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const params = new URLSearchParams({
      mobile: this.normalize(phone),
      otp: code,
    });
    const res = await this.request(
      `${this.baseUrl}/verify?${params.toString()}`,
      {
        method: 'GET',
        headers: { authkey: this.authKey as string },
      },
    );
    const body = (await res.json().catch(() => ({}))) as {
      type?: string;
      message?: string;
    };
    return res.ok && body.type === 'success';
  }

  private maskPhone(phone: string): string {
    const d = this.normalize(phone);
    return d.length > 4 ? `${'*'.repeat(d.length - 4)}${d.slice(-4)}` : '****';
  }
}
