import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GameDto {
  @ApiProperty({ description: 'Internal primary key' })
  id: number;

  @ApiProperty({ description: 'Steam App ID' })
  appid: number;

  @ApiProperty({ description: 'Game name' })
  name: string;

  @ApiPropertyOptional({ description: 'Game image URL', nullable: true })
  image_link: string | null;

  @ApiProperty({ description: 'Current total player count across all servers' })
  players: number;

  @ApiProperty({ description: 'Total number of servers' })
  servers: number;

  @ApiProperty({
    description: 'Hourly online counts for the last 24 hours',
    type: [Number],
  })
  hourly_online: number[];

  @ApiPropertyOptional({ description: 'Last updated timestamp', nullable: true })
  updated_at: Date | null;
}

export class GamesListResponseDto {
  @ApiProperty({ type: [GameDto] })
  data: GameDto[];

  @ApiProperty({ description: 'Total number of matching games' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}
