import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GamesService } from './games.service';
import { QueryGamesDto } from './dto/query-games.dto';
import { GameDto, GamesListResponseDto } from './dto/game-response.dto';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated and sorted list of games' })
  @ApiOkResponse({ type: GamesListResponseDto })
  findAll(@Query() query: QueryGamesDto): Promise<GamesListResponseDto> {
    return this.gamesService.findAll(query);
  }

  @Get(':appid')
  @ApiOperation({ summary: 'Get a single game by Steam App ID' })
  @ApiParam({ name: 'appid', description: 'Steam App ID', type: Number })
  @ApiOkResponse({ type: GameDto })
  @ApiNotFoundResponse({ description: 'Game not found' })
  findOne(@Param('appid', ParseIntPipe) appid: number): Promise<GameDto> {
    return this.gamesService.findByAppid(appid);
  }
}
