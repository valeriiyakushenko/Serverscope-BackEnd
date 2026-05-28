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
}

export class ServersListResponseDto {
  @ApiProperty({ type: [ServerItemDto] }) data: Partial<Server>[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
