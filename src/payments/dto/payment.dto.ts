import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePaymentOrderDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 998 })
  @IsNumber()
  @Min(1)
  amount: number;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'order_3f1c2b9a' })
  @IsString()
  @IsNotEmpty()
  providerOrderId: string;

  @ApiProperty({ example: 'pay_7d2e1f0a' })
  @IsString()
  @IsNotEmpty()
  providerPaymentId: string;

  @ApiProperty({ example: 'd1e2f3a4b5c6...' })
  @IsString()
  @IsNotEmpty()
  signature: string;
}

export class RefundDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ example: 998, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}

export class CodConfirmDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class WebhookDto {
  @ApiProperty({ example: 'payment.captured' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({
    example: { providerOrderId: 'order_3f1c2b9a', status: 'paid' },
  })
  @IsObject()
  payload: Record<string, unknown>;
}
