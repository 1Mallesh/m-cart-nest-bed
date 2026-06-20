import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Asha Rao' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'mallesh@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateUserRolesDto {
  @ApiProperty({
    enum: Role,
    isArray: true,
    example: [Role.CUSTOMER, Role.VENDOR],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true })
  roles: Role[];
}

export class UpdateUserStatusDto {
  @ApiProperty({
    example: false,
    description: 'true = active, false = deactivated',
  })
  @IsBoolean()
  isActive: boolean;
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: Role, description: 'Filter by role' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'asha',
    description: 'Search name / email / phone',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
