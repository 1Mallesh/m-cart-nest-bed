import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VendorDocumentDto {
  @ApiProperty({ example: 'gst_certificate' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'https://cdn.M-Cart.com/docs/gst-123.pdf' })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class RegisterVendorDto {
  @ApiProperty({ example: 'Sharma Electronics' })
  @IsString()
  @IsNotEmpty()
  shopName: string;

  @ApiProperty({ example: '29ABCDE1234F1Z5' })
  @IsString()
  @IsNotEmpty()
  gstNumber: string;

  @ApiProperty({ example: 'ABCDE1234F' })
  @IsString()
  @IsNotEmpty()
  panNumber: string;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  @IsNotEmpty()
  bankAccount: string;

  @ApiProperty({ example: 'HDFC0001234' })
  @IsString()
  @IsNotEmpty()
  ifsc: string;

  @ApiPropertyOptional({ example: 'sharma@okhdfcbank' })
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiProperty({
    example: {
      line1: '12 MG Road',
      city: 'Bengaluru',
      state: 'KA',
      pincode: '560001',
    },
  })
  @IsObject()
  address: Record<string, unknown>;
}

export class UpdateVendorDto extends PartialType(RegisterVendorDto) {}

export class UploadDocumentsDto {
  @ApiProperty({ type: [VendorDocumentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorDocumentDto)
  documents: VendorDocumentDto[];
}

export class RejectVendorDto {
  @ApiProperty({ example: 'GST number could not be verified' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
