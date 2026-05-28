import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServersService } from './servers.service';
import { QueryServersDto, QueryServersMapsDto, ServerChartQueryDto, ServerHistoryQueryDto, ServerRankHistoryQueryDto } from './dto/query-servers.dto';
import { ServersListResponseDto, ServerMapDto, ServerDetailDto, ServerChartResponseDto, ServerRankChartResponseDto, ServerUptimeChartResponseDto } from './dto/server-response.dto';

@ApiTags('Servers')
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of servers' })
  @ApiOkResponse({ type: ServersListResponseDto })
  findAll(@Query() query: QueryServersDto): Promise<ServersListResponseDto> {
    return this.serversService.findAll(query);
  }

  @Get('maps')
  @ApiOperation({ summary: 'Get unique maps list for a game' })
  @ApiOkResponse({ type: [ServerMapDto] })
  findMaps(@Query() query: QueryServersMapsDto): Promise<ServerMapDto[]> {
    return this.serversService.findMaps(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get server by id' })
  @ApiOkResponse({ type: ServerDetailDto })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ServerDetailDto> {
    return this.serversService.findOne(id);
  }

  @Get(':id/chart')
  @ApiOperation({ summary: 'Get online chart for a server' })
  @ApiOkResponse({ type: ServerChartResponseDto })
  findChart(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ServerChartQueryDto,
  ): Promise<ServerChartResponseDto> {
    return this.serversService.findChart(id, query);
  }

  @Get(':id/rank-chart')
  @ApiOperation({ summary: 'Get rank history chart for a server' })
  @ApiOkResponse({ type: ServerRankChartResponseDto })
  findRankChart(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ServerRankHistoryQueryDto,
  ): Promise<ServerRankChartResponseDto> {
    return this.serversService.findRankChart(id, query);
  }

  @Get(':id/uptime-chart')
  @ApiOperation({ summary: 'Get uptime/downtime chart for a server' })
  @ApiOkResponse({ type: ServerUptimeChartResponseDto })
  findUptimeChart(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ServerHistoryQueryDto,
  ): Promise<ServerUptimeChartResponseDto> {
    return this.serversService.findUptimeChart(id, query);
  }
}
