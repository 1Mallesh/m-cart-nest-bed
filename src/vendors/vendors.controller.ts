import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  RegisterVendorDto,
  RejectVendorDto,
  UpdateVendorDto,
  UploadDocumentsDto,
} from './dto/vendor.dto';
import { VendorsService } from './vendors.service';

@ApiTags('vendors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'vendors', version: '1' })
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Post('register')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Register a vendor profile (KYC pending)' })
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterVendorDto) {
    return this.vendors.register(user.userId, dto);
  }

  @Post('upload-documents')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Upload KYC documents' })
  uploadDocuments(
    @CurrentUser() user: AuthUser,
    @Body() dto: UploadDocumentsDto,
  ) {
    return this.vendors.uploadDocuments(user.userId, dto.documents);
  }

  @Post('submit-kyc')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Submit KYC for review' })
  submitKyc(@CurrentUser() user: AuthUser) {
    return this.vendors.submitKyc(user.userId);
  }

  @Get('profile')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Get the current vendor profile' })
  getProfile(@CurrentUser() user: AuthUser) {
    return this.vendors.getProfile(user.userId);
  }

  @Put('profile')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Update the current vendor profile' })
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateVendorDto) {
    return this.vendors.updateProfile(user.userId, dto);
  }

  @Get('dashboard')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Vendor dashboard counts' })
  dashboard(@CurrentUser() user: AuthUser) {
    return this.vendors.dashboard(user.userId);
  }

  @Get('earnings')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Vendor earnings totals' })
  earnings(@CurrentUser() user: AuthUser) {
    return this.vendors.earnings(user.userId);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve a vendor (admin)' })
  approve(@Param('id') id: string) {
    return this.vendors.approve(id);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reject a vendor (admin)' })
  reject(@Param('id') id: string, @Body() dto: RejectVendorDto) {
    return this.vendors.reject(id, dto.reason);
  }

  @Post(':id/verify-kyc')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mock GST/PAN verification (admin)' })
  verifyKyc(@Param('id') id: string) {
    return this.vendors.verifyGstPan(id);
  }
}
