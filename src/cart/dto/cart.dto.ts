import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsNumber, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  product: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  vendor: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 499.99 })
  @IsNumber()
  @Min(0)
  price: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  quantity: number;
}
