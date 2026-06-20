import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SearchTravelDto {
  @ApiProperty({ example: 'BLR' })
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({ example: 'DEL' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsString()
  date?: string;
}

export class PassengerDto {
  @ApiProperty({ example: 'Asha Rao' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 32 })
  @IsInt()
  @Min(0)
  age: number;

  @ApiPropertyOptional({ example: '12A' })
  @IsOptional()
  @IsString()
  seat?: string;
}

export class BookFlightDto {
  @ApiProperty({ example: '6650f1a2b3c4d5e6f7a8b9c0' })
  @IsString()
  @IsNotEmpty()
  flightId: string;

  @ApiProperty({ type: [PassengerDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];
}

export class BookBusDto {
  @ApiProperty({ example: '6650f1a2b3c4d5e6f7a8b9c0' })
  @IsString()
  @IsNotEmpty()
  busId: string;

  @ApiProperty({ example: ['A1', 'A2'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  seats: string[];
}
