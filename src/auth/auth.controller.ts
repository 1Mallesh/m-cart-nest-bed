import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import {
  AuthTokensDto,
  GoogleLoginDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  RequestOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer with email + password' })
  @ApiOkResponse({ type: AuthTokensDto })
  register(@Body() dto: RegisterDto): Promise<AuthTokensDto> {
    return this.auth.register(dto.name, dto.email, dto.password, dto.role);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Email + password login' })
  @ApiOkResponse({ type: AuthTokensDto })
  login(@Body() dto: LoginDto): Promise<AuthTokensDto> {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('otp/request')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request an OTP for phone login' })
  requestOtp(
    @Body() dto: RequestOtpDto,
  ): Promise<{ sent: boolean; devCode?: string }> {
    return this.auth.requestOtp(dto.phone);
  }

  @Post('otp/resend')
  @HttpCode(200)
  @ApiOperation({ summary: 'Resend the OTP for phone login' })
  resendOtp(
    @Body() dto: RequestOtpDto,
  ): Promise<{ sent: boolean; devCode?: string }> {
    return this.auth.resendOtp(dto.phone);
  }

  @Post('otp/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify OTP and log in (creates account if new)' })
  @ApiOkResponse({ type: AuthTokensDto })
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthTokensDto> {
    return this.auth.verifyOtp(dto.phone, dto.code);
  }

  @Post('google')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with Google ID token' })
  @ApiOkResponse({ type: AuthTokensDto })
  google(@Body() dto: GoogleLoginDto): Promise<AuthTokensDto> {
    // Demo: derive a stable googleId from the token. Replace with verified sub.
    const googleId = `g_${dto.idToken.slice(0, 24)}`;
    return this.auth.googleLogin(dto.email ?? '', googleId);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Exchange a refresh token for new tokens (rotation)',
  })
  @ApiOkResponse({ type: AuthTokensDto })
  refresh(@Body() dto: RefreshDto): Promise<AuthTokensDto> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke the current refresh session' })
  async logout(@CurrentUser() user: AuthUser): Promise<void> {
    await this.auth.logout(user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the authenticated user identity' })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
