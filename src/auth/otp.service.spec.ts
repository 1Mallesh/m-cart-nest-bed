import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(() => {
    const config = { get: () => 300 } as unknown as ConfigService;
    service = new OtpService(config);
  });

  it('generates a 6-digit code', () => {
    const code = service.generate('+919876543210');
    expect(code).toMatch(/^\d{6}$/);
  });

  it('verifies a correct code once', () => {
    const code = service.generate('+919876543210');
    expect(service.verify('+919876543210', code)).toBe(true);
    // single-use: a second verify fails
    expect(service.verify('+919876543210', code)).toBe(false);
  });

  it('rejects a wrong code', () => {
    service.generate('+919876543210');
    expect(service.verify('+919876543210', '000000')).toBe(false);
  });

  it('rejects an expired code', () => {
    const t0 = 1_000_000;
    const code = service.generate('+919876543210', t0);
    expect(service.verify('+919876543210', code, t0 + 301_000)).toBe(false);
  });

  it('rejects unknown phone', () => {
    expect(service.verify('+910000000000', '123456')).toBe(false);
  });
});
