import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const NOTIFICATION_CHANNELS = [
  'email',
  'sms',
  'push',
  'whatsapp',
] as const;

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 20;
}

export class TestNotificationDto {
  @ApiProperty({ example: '6650f1a2b3c4d5e6f7a8b9c0' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'push', enum: NOTIFICATION_CHANNELS })
  @IsIn(NOTIFICATION_CHANNELS as unknown as string[])
  channel: (typeof NOTIFICATION_CHANNELS)[number];

  @ApiProperty({ example: 'Order shipped' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your order #1234 has been shipped.' })
  @IsString()
  @IsNotEmpty()
  body: string;
}
