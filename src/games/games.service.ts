import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './games.entity';
import { QueryGamesDto } from './dto/query-games.dto';
import { GamesListResponseDto } from './dto/game-response.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  async findAll(query: QueryGamesDto): Promise<GamesListResponseDto> {
    const { page = 1, limit = 20, sortBy = 'players', order = 'desc', search } = query;

    const qb = this.gameRepository.createQueryBuilder('game');

    if (search) {
      qb.where('LOWER(game.name) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    qb.orderBy(`game.${sortBy}`, order.toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findByAppid(appid: number): Promise<Game> {
    const game = await this.gameRepository.findOne({ where: { appid } });
    if (!game) {
      throw new NotFoundException(`Game with appid ${appid} not found`);
    }
    return game;
  }
}
