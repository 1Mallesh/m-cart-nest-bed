import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'electronics' })
  @IsString()
  slug: string;

  @ApiProperty({ example: '665f1e2b9c3a1f0012a3b4c5', required: false })
  @IsOptional()
  @IsMongoId()
  parent?: string;

  @ApiProperty({
    example: 'https://cdn.M-Cart.com/cat/electronics.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
