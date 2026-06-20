import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: any;
  let jwt: any;
  let otp: any;

  const config = {
    get: (key: string, def?: any) => def ?? 'test-secret',
  } as unknown as ConfigService;

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findByGoogleId: jest.fn(),
      findByIdWithRefresh: jest.fn(),
      create: jest.fn(),
      setRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
    };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
      verifyAsync: jest.fn(),
    } as unknown as JwtService;
    otp = { generate: jest.fn(), verify: jest.fn() } as unknown as OtpService;
    const msg91 = { sendOtp: jest.fn().mockResolvedValue(undefined) } as any;
    service = new AuthService(users, jwt, config, otp, msg91);
  });

  describe('register', () => {
    it('rejects a duplicate email', async () => {
      users.findByEmail.mockResolvedValue({ id: '1' });
      await expect(
        service.register('A', 'a@x.com', 'password123'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a user and returns tokens', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue({
        id: '1',
        email: 'a@x.com',
        roles: ['customer'],
      });
      const tokens = await service.register('A', 'a@x.com', 'password123');
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.tokenType).toBe('Bearer');
      expect(users.setRefreshTokenHash).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('rejects unknown user', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(service.login('a@x.com', 'pw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a bad password', async () => {
      const passwordHash = await bcrypt.hash('correct-pw', 10);
      users.findByEmail.mockResolvedValue({
        id: '1',
        email: 'a@x.com',
        roles: [],
        passwordHash,
      });
      await expect(service.login('a@x.com', 'wrong-pw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('logs in with a correct password', async () => {
      const passwordHash = await bcrypt.hash('correct-pw', 10);
      users.findByEmail.mockResolvedValue({
        id: '1',
        email: 'a@x.com',
        roles: ['customer'],
        passwordHash,
      });
      const tokens = await service.login('a@x.com', 'correct-pw');
      expect(tokens.accessToken).toBe('signed.jwt.token');
    });
  });

  describe('verifyOtp', () => {
    it('rejects an invalid OTP', async () => {
      otp.verify.mockReturnValue(false);
      await expect(service.verifyOtp('+91', '000000')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('creates a new user on first OTP login', async () => {
      otp.verify.mockReturnValue(true);
      users.findByPhone.mockResolvedValue(null);
      users.create.mockResolvedValue({ id: '2', roles: ['customer'] });
      const tokens = await service.verifyOtp('+919876543210', '123456');
      expect(users.create).toHaveBeenCalled();
      expect(tokens.accessToken).toBeDefined();
    });
  });

  describe('refresh', () => {
    it('rejects an unverifiable token', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('bad'));
      await expect(service.refresh('x')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('detects refresh token reuse', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: '1' });
      const otherHash = await bcrypt.hash('a-different-token', 10);
      users.findByIdWithRefresh.mockResolvedValue({
        id: '1',
        roles: [],
        refreshTokenHash: otherHash,
      });
      await expect(
        service.refresh('the-presented-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
