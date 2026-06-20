import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNotEmpty, IsString } from 'class-validator';

export class PushLocationDto {
  @ApiProperty({ example: '6650f1a2b3c4d5e6f7a8b9c0' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 12.9716 })
  @IsLatitude()
  lat: number;

  @ApiProperty({ example: 77.5946 })
  @IsLongitude()
  lng: number;
}
