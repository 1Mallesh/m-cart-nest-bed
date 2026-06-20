import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AddMoneyDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Wallet top-up' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class WithdrawDto {
  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Withdrawal to bank', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class WalletPaginationDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
