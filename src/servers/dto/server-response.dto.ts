import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../servers.entity';

export class ServerMapDto {
  @ApiProperty() map: string;
  @ApiProperty() serverCount: number;
}

export class ServerItemDto {
  @ApiProperty() id: number;
  @ApiProperty() ip: string;
  @ApiProperty() queryPort: number;
  @ApiProperty() gamePort: number;
  @ApiProperty() name: string;
  @ApiProperty() appid: number;
  @ApiProperty() map: string;
  @ApiProperty() isSecure: boolean;
  @ApiProperty() isDedicated: boolean;
  @ApiProperty() os: string;
  @ApiProperty() region: number;
  @ApiProperty() maxPlayers: number;
  @ApiProperty() players: number;
  @ApiProperty() rank: number;
  @ApiProperty({ type: [Number] }) hourlyOnline: number[];
  @ApiProperty() isOnline: boolean;
  @ApiProperty() version: string;
  @ApiProperty() lastSeenAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() popularity: number;
  @ApiProperty() stability: number;
}

export class ServersListResponseDto {
  @ApiProperty({ type: [ServerItemDto] }) data: Partial<Server>[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class ServerDetailDto extends ServerItemDto {
  @ApiProperty() createdAt: Date;
}

export class ServerChartPointDto {
  @ApiProperty() time: string;
  @ApiProperty() players: number;
}

export class ServerChartResponseDto {
  @ApiProperty({ type: [ServerChartPointDto] }) points: ServerChartPointDto[];
}

export class ServerRankChartPointDto {
  @ApiProperty() time: string;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'null for a day without a ranking calculation',
  })
  rank: number | null;
  @ApiProperty({ type: Number, nullable: true }) score: number | null;
  @ApiProperty({ type: Number, nullable: true })
  uptimeRatio: number | null;
}

export class ServerRankChartResponseDto {
  @ApiProperty({ type: [ServerRankChartPointDto] })
  points: ServerRankChartPointDto[];
}

export class ServerUptimeChartPointDto {
  @ApiProperty() time: string;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'null for a day without a ranking calculation (3d/7d/30d)',
  })
  uptimeRatio: number | null;
  @ApiProperty({ type: Number, nullable: true })
  downtimeRatio: number | null;
}

export class ServerUptimeChartResponseDto {
  @ApiProperty({ type: [ServerUptimeChartPointDto] })
  points: ServerUptimeChartPointDto[];
}
