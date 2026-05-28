import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServersService } from './servers.service';
import { QueryServersDto, QueryServersMapsDto } from './dto/query-servers.dto';
import { ServersListResponseDto, ServerMapDto } from './dto/server-response.dto';

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
}
