import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Noise-Cancelling Headphones' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'wireless-noise-cancelling-headphones' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Over-ear Bluetooth headphones with ANC.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 7999 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 9999 })
  @IsNumber()
  @Min(0)
  mrp: number;

  @ApiProperty({ example: 'INR', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: '665f1e2b9c3a1f0012a3b4c5' })
  @IsMongoId()
  category: string;

  @ApiProperty({ example: '665f1e2b9c3a1f0012a3b4c6', required: false })
  @IsOptional()
  @IsMongoId()
  brand?: string;

  @ApiProperty({
    example: ['https://cdn.M-Cart.com/p/1.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    example: { color: 'black', warranty: '1 year' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class RejectProductDto {
  @ApiProperty({ example: 'Images do not meet quality guidelines.' })
  @IsString()
  reason: string;
}

export class BulkUploadProductDto {
  @ApiProperty({ type: [CreateProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductDto)
  products: CreateProductDto[];
}

export class FindProductsQueryDto {
  @ApiProperty({ example: '665f1e2b9c3a1f0012a3b4c5', required: false })
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiProperty({ example: '665f1e2b9c3a1f0012a3b4c6', required: false })
  @IsOptional()
  @IsMongoId()
  brand?: string;

  @ApiProperty({ example: 'headphones', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 1000, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ example: 10000, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
