import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AdjustInventoryDto {
  @ApiProperty({
    example: 10,
    description: 'Signed delta applied to quantity (can be negative)',
  })
  @IsInt()
  delta: number;
}
