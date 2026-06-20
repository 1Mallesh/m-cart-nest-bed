import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ example: 12.9716 })
  @IsLatitude()
  lat: number;

  @ApiProperty({ example: 77.5946 })
  @IsLongitude()
  lng: number;
}

export class OrderActionDto {
  @ApiProperty({ example: '6650f1a2b3c4d5e6f7a8b9c0' })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class DeliveryDocumentDto {
  @ApiProperty({ example: 'driving_license' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'https://cdn.M-Cart.com/docs/dl-123.pdf' })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class RegisterDeliveryDto {
  @ApiProperty({ example: 'Ravi Kumar' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '1234 5678 9012' })
  @IsString()
  @IsNotEmpty()
  aadhaarNumber: string;

  @ApiProperty({ example: 'ABCDE1234F' })
  @IsString()
  @IsNotEmpty()
  panNumber: string;

  @ApiProperty({ example: 'KA0120200012345' })
  @IsString()
  @IsNotEmpty()
  drivingLicense: string;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  @IsNotEmpty()
  bankAccount: string;

  @ApiProperty({ example: 'HDFC0001234' })
  @IsString()
  @IsNotEmpty()
  ifsc: string;

  @ApiPropertyOptional({ example: 'ravi@okhdfcbank' })
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiProperty({ example: 'bike' })
  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @ApiProperty({ example: 'KA01AB1234' })
  @IsString()
  @IsNotEmpty()
  vehicleNumber: string;

  @ApiPropertyOptional({ example: '560001' })
  @IsOptional()
  @IsString()
  zone?: string;
}

export class UpdateDeliveryProfileDto extends PartialType(
  RegisterDeliveryDto,
) {}

export class UploadDeliveryDocumentsDto {
  @ApiProperty({ type: [DeliveryDocumentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryDocumentDto)
  documents: DeliveryDocumentDto[];
}

export class RejectDeliveryDto {
  @ApiProperty({ example: 'Driving license expired' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class AssignOrderDto {
  @ApiProperty({ example: '6650f1a2b3c4d5e6f7a8b9c0' })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class AutoAssignDto {
  @ApiProperty({ example: '6650f1a2b3c4d5e6f7a8b9c0' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 12.9716, description: 'Pickup latitude' })
  @IsLatitude()
  lat: number;

  @ApiProperty({ example: 77.5946, description: 'Pickup longitude' })
  @IsLongitude()
  lng: number;

  @ApiPropertyOptional({ example: '560001' })
  @IsOptional()
  @IsString()
  zone?: string;
}

export class ProofOfDeliveryDto {
  @ApiProperty({ example: '6650f1a2b3c4d5e6f7a8b9c0' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: '482913', description: 'OTP shared by the customer' })
  @IsString()
  @Length(4, 6)
  otp: string;

  @ApiPropertyOptional({
    example: 'https://cdn.M-Cart.com/pod/order-123.jpg',
    description: 'Cloudinary URL of the delivery photo',
  })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
