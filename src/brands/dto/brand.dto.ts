import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Acme' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'acme' })
  @IsString()
  slug: string;

  @ApiProperty({
    example: 'https://cdn.M-Cart.com/brand/acme.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
