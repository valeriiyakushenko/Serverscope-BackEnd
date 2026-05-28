import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryServersDto {
  @ApiProperty({ description: 'Game appid filter' })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  appid: number;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({ description: 'Search by server name (case-insensitive)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by IP address (exact match)' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ enum: ['name', 'rank', 'players'], default: 'rank' })
  @IsOptional()
  @Transform(({ value }) => value ?? 'rank')
  @IsIn(['name', 'rank', 'players'])
  sortBy?: 'name' | 'rank' | 'players' = 'rank';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @Transform(({ value }) => value ?? 'asc')
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ description: 'Exact map filter' })
  @IsOptional()
  @IsString()
  map?: string;

  @ApiPropertyOptional({ description: 'Filter by VAC-secured servers' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isSecure?: boolean;

  @ApiPropertyOptional({ description: 'Filter by online status' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isOnline?: boolean;
}

export class QueryServersMapsDto {
  @ApiProperty({ description: 'Game appid filter' })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  appid: number;

  @ApiPropertyOptional({ description: 'Minimum number of servers per map', default: 100, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minServers?: number = 100;
}

export class ServerChartQueryDto {
  @ApiProperty({ enum: ['24h', '3d', '7d', '30d'], description: 'Chart period' })
  @IsNotEmpty()
  @IsIn(['24h', '3d', '7d', '30d'])
  period: '24h' | '3d' | '7d' | '30d';
}
